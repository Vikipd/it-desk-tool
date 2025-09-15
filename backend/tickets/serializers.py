from rest_framework import serializers
from django.utils import timezone
from .models import Ticket, Comment

class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'ticket', 'author', 'author_username', 'text', 'created_at']
        read_only_fields = ['author', 'created_at']

class TicketSerializer(serializers.ModelSerializer):
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault())
    username = serializers.CharField(source='created_by.username', read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)
    node_name = serializers.CharField(max_length=100)     
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_id', 'created_by', 'username', 'node_name', 
            'card_serial_number', 'circle', 'node_location', 'ba_oa', 
            'card_category',
            'fault_description', 'priority', 'status', 'created_at', 'updated_at', 
            'attachment', 'comments','assigned_to', 'assigned_to_username'
        ]
        
        read_only_fields = ['ticket_id', 'created_at', 'updated_at']
        
    def create(self, validated_data):
        # This context is already provided by default in recent DRF versions,
        # but explicitly setting it is fine.
        validated_data['created_by'] = self.context['request'].user
        ticket = Ticket(**validated_data)
        ticket.save()
        ticket.ticket_id = f"TKT-{timezone.now().year}-{ticket.id:03d}"
        ticket.save()
        return ticket