# D:\it-admin-tool\backend\tickets\views.py

from rest_framework import viewsets, permissions, filters, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
import pandas as pd
from io import BytesIO
from .models import Ticket, Comment
from .serializers import TicketSerializer, CommentSerializer
from .filters import TicketFilter
from django.contrib.auth import get_user_model

User = get_user_model()

class TicketViewSet(viewsets.ModelViewSet):
    # --- All other methods are correct and do not need changes ---
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TicketFilter
    search_fields = ['ticket_id', 'node_name', 'card_serial_number']
    ordering_fields = ['created_at', 'priority']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser: return Ticket.objects.all().order_by('-created_at')
        if hasattr(user, 'role') and user.role == 'OBSERVER': return Ticket.objects.all().order_by('-created_at')
        if hasattr(user, 'role') and user.role == 'TECHNICIAN': return Ticket.objects.filter(assigned_to=user).order_by('-created_at')
        return Ticket.objects.filter(created_by=user).order_by('-created_at')
    
    # ... (perform_create, partial_update, assign_ticket, dashboard_stats, card_main_categories all remain unchanged) ...
    def perform_create(self, serializer): serializer.save(created_by=self.request.user)
    def partial_update(self, request, *args, **kwargs):
        ticket = self.get_object(); user = request.user; new_status = request.data.get('status'); new_priority = request.data.get('priority')
        if new_status:
            allowed_technician_statuses = ['IN_PROGRESS', 'IN_TRANSIT', 'UNDER_REPAIR', 'RESOLVED']
            if user.role == 'TECHNICIAN' and new_status not in allowed_technician_statuses: return Response({'error': f'Technicians cannot set status to "{new_status}".'}, status=status.HTTP_403_FORBIDDEN)
        if new_priority:
            if not user.is_superuser: return Response({'error': 'Only Admins can change ticket priority.'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)
    @action(detail=True, methods=['post'], url_path='assign', permission_classes=[permissions.IsAdminUser])
    def assign_ticket(self, request, pk=None):
        ticket = self.get_object(); technician_id = request.data.get('technician_id')
        if not technician_id: return Response({'error': 'Technician ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try: technician = User.objects.get(pk=technician_id, role=User.TECHNICIAN)
        except User.DoesNotExist: return Response({'error': 'Invalid Technician ID.'}, status=status.HTTP_404_NOT_FOUND)
        ticket.assigned_to = technician; ticket.save(); serializer = self.get_serializer(ticket); return Response(serializer.data)
    @action(detail=False, methods=['get'], url_path='dashboard-stats')
    def dashboard_stats(self, request):
        user = self.request.user; response_data = {}
        if user.is_superuser or (hasattr(user, 'role') and user.role == 'OBSERVER'): tickets_queryset = Ticket.objects.all(); response_data['total_users'] = User.objects.count()
        else: tickets_queryset = self.get_queryset()
        sla_complete_statuses = ['RESOLVED', 'CLOSED']; resolution_duration = ExpressionWrapper(F('closed_at') - F('created_at'), output_field=DurationField())
        sla_data = Ticket.objects.filter(status__in=sla_complete_statuses, closed_at__isnull=False).values('priority').annotate(avg_resolution_duration=Avg(resolution_duration))
        sla_dict = {item['priority']: item['avg_resolution_duration'].total_seconds() / (3600 * 24) for item in sla_data if item['avg_resolution_duration']}
        by_priority_counts = tickets_queryset.values('priority').annotate(count=Count('priority')); by_priority_combined = []
        for item in by_priority_counts:
            priority = item['priority']; by_priority_combined.append({'priority': priority, 'count': item['count'], 'avg_resolution_days': sla_dict.get(priority, 0)})
        total_tickets = tickets_queryset.count(); by_status = tickets_queryset.values('status').annotate(count=Count('status')); by_category = tickets_queryset.values('card_category').annotate(count=Count('card_category'))
        response_data.update({'total_tickets': total_tickets, 'open_tickets': tickets_queryset.exclude(status__in=sla_complete_statuses).count(), 'closed_tickets': tickets_queryset.filter(status__in=sla_complete_statuses).count(), 'by_status': list(by_status), 'by_priority': by_priority_combined, 'by_category': list(by_category),})
        return Response(response_data)
    @action(detail=False, methods=['get'], url_path='card-main-categories')
    def card_main_categories(self, request):
        from .filters import CARD_CATEGORY_GROUPS
        main_categories = list(CARD_CATEGORY_GROUPS.keys()); main_categories.append('Other'); return Response(main_categories, status=status.HTTP_200_OK)

    # ==============================================================================
    # --- START OF THE DEFINITIVE FIX ---
    # ==============================================================================
    @action(detail=False, methods=['get'], url_path='export')
    def export_tickets(self, request):
        # 1. Get the base queryset and apply any filters from the request URL.
        # This now correctly handles calls from Client, Admin, and Filtered pages.
        queryset = self.get_queryset()
        filtered_queryset = self.filter_queryset(queryset)

        # 2. Eagerly load related user data to prevent thousands of DB queries.
        # This is a critical performance optimization.
        final_queryset = filtered_queryset.select_related('created_by', 'assigned_to')

        if not final_queryset.exists():
            return Response(status=status.HTTP_204_NO_CONTENT)

        # 3. Prepare the data for the DataFrame.
        data_for_df = []
        for ticket in final_queryset:
            data_for_df.append({
                'Ticket ID': ticket.ticket_id,
                'Node Name': ticket.node_name,
                'Issue Description': ticket.fault_description,
                'Card Category': ticket.card_category,
                'Status': ticket.status,
                'Priority': ticket.priority,
                'Circle': ticket.circle,
                'Assigned To': ticket.assigned_to.username if ticket.assigned_to else 'Unassigned',
                'Created By': ticket.created_by.username if ticket.created_by else 'Unknown User',
                'Created At': ticket.created_at.strftime('%Y-%m-%d %H:%M:%S') if ticket.created_at else ''
            })

        # 4. Create the DataFrame and the Excel file.
        df = pd.DataFrame(data_for_df)
        
        excel_file = BytesIO()
        df.to_excel(excel_file, index=False, sheet_name='Tickets Export')
        excel_file.seek(0)
        
        response = HttpResponse(excel_file.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="tickets_export.xlsx"'
        return response
    # ==============================================================================
    # --- END OF THE DEFINITIVE FIX ---
    # ==============================================================================

# ... (Comment Views remain unchanged and correct) ...
class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer; permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return Comment.objects.filter(ticket_id=self.kwargs['ticket_pk'])
    def perform_create(self, serializer): ticket = get_object_or_404(Ticket, pk=self.kwargs['ticket_pk']); serializer.save(author=self.request.user, ticket=ticket)
class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all(); serializer_class = CommentSerializer; permission_classes = [permissions.IsAuthenticated]
    def perform_create(self, serializer): serializer.save(author=self.request.user)