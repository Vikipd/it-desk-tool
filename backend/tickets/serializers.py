# COPY AND PASTE THIS ENTIRE BLOCK. THIS IS THE FINAL AND CORRECTED VERSION.

from rest_framework import serializers
from django.utils import timezone
from .models import Ticket, Comment, Card
from accounts.models import User

class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = '__all__'

class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'ticket', 'author', 'author_username', 'text', 'created_at']
        # --- THIS IS THE FINAL FIX ---
        # We tell the serializer that 'author' and 'ticket' will be provided by the view,
        # not by the user. This solves the validation error.
        read_only_fields = ['author', 'ticket']
        # --- END OF FIX ---

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
                    'zone': validated_data.get('zone', 'N/A'),
                    'state': validated_data.get('state', 'N/A'),
                    'node_type': validated_data.get('node_type', 'N/A'),
                    'location': validated_data.get('location', 'N/A'),
                    'card_type': validated_data.get('other_card_type_description', 'Other'),
                    'node_name': validated_data.get('manual_node_name', 'N/A'),
                    'primary_ip': validated_data.get('manual_primary_ip', '0.0.0.0'),
                    'aid': validated_data.get('manual_aid', 'N/A'),
                    'unit_part_number': validated_data.get('manual_unit_part_number', 'N/A'),
                    'clei': validated_data.get('manual_clei', 'N/A'),
                    'slot': validated_data.get('manual_slot', 'N/A'),
                }
            )
        else:
            raise serializers.ValidationError("Insufficient data. Provide a serial number or an 'Other' card type description.")

        ticket = Ticket.objects.create(
            card=card_instance, 
            created_by=user,
            fault_description=validated_data['fault_description'],
            priority=validated_data['priority'],
            attachment=validated_data.get('attachment'),
            other_card_type_description=validated_data.get('other_card_type_description')
        )
        return ticket

class TicketDetailSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)
    card = CardSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role=User.TECHNICIAN), allow_null=True, required=False)
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_id', 'created_by_username', 'assigned_to', 'assigned_to_username', 'card', 'comments',
            'fault_description', 'priority', 'attachment', 'other_card_type_description',
            'status', 'created_at', 'updated_at', 'assigned_at', 'in_progress_at', 'in_transit_at', 
            'under_repair_at', 'on_hold_at', 'resolved_at', 'closed_at'
        ]
        read_only_fields = ['ticket_id', 'created_at', 'updated_at']