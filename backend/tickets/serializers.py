# Path: E:\it-admin-tool\backend\tickets\serializers.py
# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from rest_framework import serializers
from django.utils import timezone
from .models import Ticket, Comment, Card, ActivityLog
from accounts.models import User
from .activity_logger import log_activity
from accounts.serializers import UserSerializer

class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = '__all__'

class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'ticket', 'author', 'author_username', 'text', 'created_at']
        read_only_fields = ['author', 'ticket']

class TicketListSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    card = CardSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_id', 'created_by', 'assigned_to', 'card', 'status', 
            'priority', 'created_at', 'closed_at'
        ]

class TicketCreateSerializer(serializers.ModelSerializer):
    serial_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    zone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    state = serializers.CharField(write_only=True, required=False, allow_blank=True)
    node_type = serializers.CharField(write_only=True, required=False, allow_blank=True)
    location = serializers.CharField(write_only=True, required=False, allow_blank=True)
    manual_node_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    manual_primary_ip = serializers.CharField(write_only=True, required=False, allow_blank=True)
    manual_aid = serializers.CharField(write_only=True, required=False, allow_blank=True)
    manual_unit_part_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    manual_clei = serializers.CharField(write_only=True, required=False, allow_blank=True)
    manual_slot = serializers.CharField(write_only=True, required=False, allow_blank=True)
    manual_serial_number = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Ticket
        fields = [
            'fault_description', 'priority', 'attachment', 'other_card_type_description', 
            'serial_number', 'zone', 'state', 'node_type', 'location', 
            'manual_node_name', 'manual_primary_ip', 'manual_aid', 
            'manual_unit_part_number', 'manual_clei', 'manual_slot', 'manual_serial_number'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        card_instance = None
        if validated_data.get('serial_number'):
            try:
                card_instance = Card.objects.get(serial_number=validated_data['serial_number'])
            except Card.DoesNotExist:
                raise serializers.ValidationError({"serial_number": "A card with this serial number does not exist."})
        elif validated_data.get('other_card_type_description'):
            temp_serial = validated_data.get('manual_serial_number') or f"OTHER-{user.id}-{timezone.now().timestamp()}"
            card_instance, created = Card.objects.get_or_create(
                serial_number=temp_serial,
                defaults={
                    'zone': validated_data.get('zone', 'N/A'), 'state': validated_data.get('state', 'N/A'),
                    'node_type': validated_data.get('node_type', 'N/A'), 'location': validated_data.get('location', 'N/A'),
                    'card_type': validated_data.get('other_card_type_description', 'Other'), 'node_name': validated_data.get('manual_node_name', 'N/A'),
                    'primary_ip': validated_data.get('manual_primary_ip', '0.0.0.0'), 'aid': validated_data.get('manual_aid', 'N/A'),
                    'unit_part_number': validated_data.get('manual_unit_part_number', 'N/A'), 'clei': validated_data.get('manual_clei', 'N/A'),
                    'slot': validated_data.get('manual_slot', 'N/A'),
                }
            )
        else:
            raise serializers.ValidationError("Insufficient data. Provide a serial number or an 'Other' card type description.")
        
        ticket_data = {
            'card': card_instance,
            'created_by': user,
            'fault_description': validated_data['fault_description'],
            'priority': validated_data['priority'],
            'attachment': validated_data.get('attachment'),
            'other_card_type_description': validated_data.get('other_card_type_description')
        }
        
        ticket = Ticket.objects.create(**ticket_data)
        return ticket

class TicketDetailSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role=User.TECHNICIAN), allow_null=True, required=False)
    card = CardSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_id', 'created_by', 'assigned_to', 'assigned_to_details', 'card', 'comments',
            'fault_description', 'priority', 'attachment', 'other_card_type_description',
            'status', 'created_at', 'updated_at', 'assigned_at', 'in_progress_at', 'in_transit_at', 
            'under_repair_at', 'on_hold_at', 'resolved_at', 'closed_at', 'sla_days'
        ]
        read_only_fields = ['id', 'ticket_id', 'created_by', 'assigned_to_details', 'card', 'comments', 'created_at', 'updated_at']

class StatusUpdateWithCommentSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Ticket.STATUS_CHOICES)
    comment = serializers.CharField(write_only=True, required=True, min_length=1)

    def save(self):
        ticket = self.context['ticket']
        request = self.context['request']
        user = request.user
        new_status = self.validated_data['status']
        comment_text = self.validated_data['comment']
        
        log_activity(
            request=request,
            action='STATUS_CHANGED',
            target=ticket.ticket_id,
            details=f"Status changed to {new_status} with comment: '{comment_text[:50]}...'"
        )

        Comment.objects.create(ticket=ticket, author=user, text=comment_text)
        ticket.status = new_status
        timestamp_field_map = {
            'IN_PROGRESS': 'in_progress_at', 'IN_TRANSIT': 'in_transit_at',
            'UNDER_REPAIR': 'under_repair_at', 'ON_HOLD': 'on_hold_at', 'RESOLVED': 'resolved_at',
        }
        timestamp_field = timestamp_field_map.get(new_status)
        if timestamp_field and not getattr(ticket, timestamp_field):
            setattr(ticket, timestamp_field, timezone.now())
        ticket.save()
        return ticket

class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'user_role', 'ip_address', 'action', 'timestamp', 'target_object_id', 'details']