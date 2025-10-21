# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from rest_framework import viewsets, permissions, filters, generics, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField, Q
from datetime import timedelta
from rest_framework.pagination import PageNumberPagination
from .models import Ticket, Comment, Card, ActivityLog
from .serializers import (
    TicketListSerializer,
    TicketDetailSerializer, 
    TicketCreateSerializer, 
    CommentSerializer, 
    CardSerializer,
    StatusUpdateWithCommentSerializer,
    ActivityLogSerializer
)
from .filters import TicketFilter, ActivityLogFilter
from accounts.models import User
from accounts.permissions import IsTechnicianRole
from .permissions import IsAdminOrObserver
from .activity_logger import log_activity

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ZoneListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        zones = Card.objects.values_list('zone', flat=True).distinct().order_by('zone')
        return Response(zones)

class StateListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        zone = request.query_params.get('zone')
        
        # --- THIS IS THE FIX ---
        # If a zone is provided, filter by it. Otherwise, get all states.
        if zone:
            queryset = Card.objects.filter(zone=zone)
        else:
            queryset = Card.objects.all()
        
        states = queryset.values_list('state', flat=True).distinct().order_by('state')
        return Response(states)
# --- END OF FIX ---

class NodeTypeListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        zone = request.query_params.get('zone')
        state = request.query_params.get('state')
        if not all([zone, state]): return Response([])
        node_types = Card.objects.filter(zone=zone, state=state).values_list('node_type', flat=True).distinct().order_by('node_type')
        return Response(node_types)

class LocationListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        zone = request.query_params.get('zone'); state = request.query_params.get('state'); node_type = request.query_params.get('node_type')
        if not all([zone, state, node_type]): return Response([])
        locations = Card.objects.filter(zone=zone, state=state, node_type=node_type).values_list('location', flat=True).distinct().order_by('location')
        return Response(locations)

class CardTypeListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        zone = request.query_params.get('zone'); state = request.query_params.get('state'); node_type = request.query_params.get('node_type'); location = request.query_params.get('location')
        if not all([zone, state, node_type, location]): return Response([])
        card_types = Card.objects.filter(zone=zone, state=state, node_type=node_type, location=location).values_list('card_type', flat=True).distinct().order_by('card_type')
        return Response(card_types)

class SlotListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        zone = request.query_params.get('zone'); state = request.query_params.get('state'); node_type = request.query_params.get('node_type'); location = request.query_params.get('location'); card_type = request.query_params.get('card_type')
        if not all([zone, state, node_type, location, card_type]): return Response([])
        slots = Card.objects.filter(zone=zone, state=state, node_type=node_type, location=location, card_type=card_type).values_list('slot', flat=True).distinct().order_by('slot')
        return Response(slots)

class CardAutofillView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        params = {key: request.query_params.get(key) for key in ['zone', 'state', 'node_type', 'location', 'card_type', 'slot']}
        if not all(params.values()):
            return Response({'error': 'All filter parameters are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            card = Card.objects.get(**params)
            serializer = CardSerializer(card)
            return Response(serializer.data)
        except Card.DoesNotExist:
            return Response({'error': 'No matching card found.'}, status=status.HTTP_404_NOT_FOUND)
        except Card.MultipleObjectsReturned:
            cards = Card.objects.filter(**params)
            serializer = CardSerializer(cards.first())
            return Response(serializer.data)

class FilteredCardDataView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, field_name):
        allowed_fields = ['node_name', 'primary_ip', 'aid', 'unit_part_number', 'clei']
        if field_name not in allowed_fields:
            return Response({'error': 'Invalid field name.'}, status=status.HTTP_400_BAD_REQUEST)
        filters = { 'zone': request.query_params.get('zone'), 'state': request.query_params.get('state'), 'node_type': request.query_params.get('node_type'), 'location': request.query_params.get('location'), }
        active_filters = {k: v for k, v in filters.items() if v}
        if not active_filters: return Response([])
        values = Card.objects.filter(**active_filters).values_list(field_name, flat=True).distinct().order_by(field_name)
        return Response(values)

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.select_related('created_by', 'assigned_to', 'card').order_by('-created_at')
    
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TicketFilter
    search_fields = ['ticket_id', 'card__node_name', 'status', 'priority', 'assigned_to__username', 'created_by__username']
    ordering_fields = ['created_at', 'priority']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        is_admin_or_observer = user.is_superuser or (hasattr(user, 'role') and user.role in [User.ADMIN, User.OBSERVER])
        if not is_admin_or_observer:
            queryset = queryset.filter(Q(created_by=user) | Q(assigned_to=user))
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TicketListSerializer
        if self.action == 'create':
            return TicketCreateSerializer
        return TicketDetailSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            self.permission_classes = [permissions.IsAdminUser]
        return super().get_permissions()

    def perform_create(self, serializer):
        ticket = serializer.save()
        log_activity(self.request.user, 'TICKET_CREATED', target=ticket.ticket_id, details=f"Created new ticket with priority {ticket.priority}.")

    def perform_update(self, serializer):
        original_ticket = self.get_object()
        original_status = original_ticket.status
        original_assignee = original_ticket.assigned_to
        
        super().perform_update(serializer)

        updated_ticket = serializer.instance
        new_status = updated_ticket.status
        new_assignee = updated_ticket.assigned_to

        if new_status != original_status:
            log_activity(self.request.user, 'STATUS_CHANGED', target=updated_ticket.ticket_id, details=f"Changed status from {original_status} to {new_status}.")
        
        if new_assignee != original_assignee:
            assignee_name = new_assignee.username if new_assignee else "Unassigned"
            log_activity(self.request.user, 'TICKET_ASSIGNED', target=updated_ticket.ticket_id, details=f"Assigned ticket to {assignee_name}.")
    
    @action(detail=False, methods=['get'], url_path='dashboard-stats')
    def dashboard_stats(self, request):
        user = self.request.user
        base_queryset = Ticket.objects.all() 
        view_as = request.query_params.get('view_as')
        if user.role in [User.ADMIN, User.OBSERVER]:
            if view_as == 'client':
                base_queryset = base_queryset.filter(created_by__role=User.CLIENT)
            elif view_as == 'technician':
                base_queryset = base_queryset.filter(assigned_to__role=User.TECHNICIAN)
        elif user.role == User.CLIENT:
             base_queryset = base_queryset.filter(created_by=user)
        elif user.role == User.TECHNICIAN:
            base_queryset = base_queryset.filter(assigned_to=user)
        
        response_data = {}
        if user.role in [User.ADMIN, User.OBSERVER]:
            response_data['total_users'] = User.objects.filter(is_active=True).count()
        
        in_progress_statuses = ['IN_PROGRESS', 'IN_TRANSIT', 'UNDER_REPAIR', 'ON_HOLD']
        status_counts = base_queryset.aggregate(
            open_tickets=Count('id', filter=Q(status='OPEN')),
            in_progress_tickets=Count('id', filter=Q(status__in=in_progress_statuses)),
            resolved_tickets=Count('id', filter=Q(status='RESOLVED')),
            closed_tickets=Count('id', filter=Q(status='CLOSED')),
            total_tickets=Count('id')
        )
        
        now = timezone.now()
        sla_complete_statuses = ['RESOLVED', 'CLOSED']
        resolution_duration_expr = ExpressionWrapper(F('resolved_at') - F('created_at'), output_field=DurationField())
        historical_sla_data = base_queryset.filter(status__in=sla_complete_statuses, resolved_at__isnull=False).values('priority').annotate(avg_resolution_duration=Avg(resolution_duration_expr))
        historical_sla_dict = { item['priority']: item['avg_resolution_duration'].total_seconds() / (3600 * 24) if item['avg_resolution_duration'] else 0 for item in historical_sla_data }

        open_age_duration_expr = ExpressionWrapper(now - F('created_at'), output_field=DurationField())
        proactive_sla_data = base_queryset.filter(status='OPEN').values('priority').annotate(avg_open_age_duration=Avg(open_age_duration_expr))
        proactive_sla_dict = { item['priority']: item['avg_open_age_duration'].total_seconds() / (3600 * 24) if item['avg_open_age_duration'] else 0 for item in proactive_sla_data }

        sla_targets = { 'CRITICAL': 3, 'HIGH': 7, 'MEDIUM': 14, 'LOW': 21 }
        open_breached_counts = base_queryset.filter(status='OPEN').annotate(
            age=now - F('created_at')
        ).aggregate(
            CRITICAL=Count('id', filter=Q(priority='CRITICAL', age__gt=timedelta(days=sla_targets['CRITICAL']))),
            HIGH=Count('id', filter=Q(priority='HIGH', age__gt=timedelta(days=sla_targets['HIGH']))),
            MEDIUM=Count('id', filter=Q(priority='MEDIUM', age__gt=timedelta(days=sla_targets['MEDIUM']))),
            LOW=Count('id', filter=Q(priority='LOW', age__gt=timedelta(days=sla_targets['LOW'])))
        )
        
        all_priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        by_priority_counts_qs = base_queryset.values('priority').annotate(count=Count('id'))
        priority_counts_dict = {item['priority']: item['count'] for item in by_priority_counts_qs}

        by_priority_combined = []
        for priority in all_priorities:
            by_priority_combined.append({
                'priority': priority,
                'count': priority_counts_dict.get(priority, 0),
                'avg_resolution_days': historical_sla_dict.get(priority, 0),
                'avg_open_age_days': proactive_sla_dict.get(priority, 0),
                'sla_target_days': sla_targets.get(priority, 30),
                'open_breached_count': open_breached_counts.get(priority, 0)
            })

        order_map = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        by_priority_combined.sort(key=lambda x: order_map.get(x['priority'], 4))
        
        by_status_counts = base_queryset.values('status').annotate(count=Count('id')).order_by('status')
        by_category_counts = base_queryset.values('card__card_type').annotate(count=Count('id')).order_by('-count')
        by_category_renamed = [{'card_category': item['card__card_type'], 'count': item['count']} for item in by_category_counts]

        response_data.update({
            'total_tickets': status_counts['total_tickets'], 'open_tickets': status_counts['open_tickets'], 'in_progress_tickets': status_counts['in_progress_tickets'],
            'resolved_tickets': status_counts['resolved_tickets'], 'closed_tickets': status_counts['closed_tickets'], 'by_status': list(by_status_counts),
            'by_priority': by_priority_combined,
            'by_category': by_category_renamed,
        })
        return Response(response_data)
        
    @action(detail=True, methods=['patch'], url_path='edit-timestamps', permission_classes=[permissions.IsAdminUser])
    def edit_timestamps(self, request, pk=None):
        ticket = self.get_object()
        serializer = self.get_serializer(ticket, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            if field.endswith('_at'):
                setattr(ticket, field, value)
        ticket.save()
        return Response(self.get_serializer(ticket).data)

    @action(detail=False, methods=['get'], url_path='export-all')
    def export_all(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = TicketListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='update-status-with-comment', permission_classes=[IsTechnicianRole])
    def update_status_with_comment(self, request, pk=None):
        ticket = self.get_object()
        serializer = StatusUpdateWithCommentSerializer(data=request.data, context={'ticket': ticket, 'user': request.user})
        if serializer.is_valid():
            serializer.save()
            return Response(TicketDetailSerializer(ticket).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.order_by('created_at')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return super().get_queryset().filter(ticket_id=self.kwargs.get('ticket_pk'))
    def perform_create(self, serializer):
        ticket_id = self.kwargs.get('ticket_pk')
        try:
            ticket = Ticket.objects.get(pk=ticket_id)
            serializer.save(author=self.request.user, ticket=ticket)
        except Ticket.DoesNotExist:
            raise serializers.ValidationError("Ticket not found.")

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.select_related('user').order_by('-timestamp')
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdminOrObserver]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = ActivityLogFilter

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)