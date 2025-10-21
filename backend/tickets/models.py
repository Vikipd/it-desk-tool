# Path: E:\it-admin-tool\backend\tickets\models.py
# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from django.db import models
from django.conf import settings
from django.utils import timezone
from accounts.models import User

class Card(models.Model):
    zone = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    node_type = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    card_type = models.CharField(max_length=100)
    slot = models.CharField(max_length=100)
    node_name = models.CharField(max_length=100)
    primary_ip = models.GenericIPAddressField()
    aid = models.CharField(max_length=100)
    unit_part_number = models.CharField(max_length=100)
    clei = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return f"{self.node_name} - {self.serial_number}"

def ticket_image_upload_path(instance, filename):
    return f"tickets/{instance.ticket_id}/{filename}"

class Ticket(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'), 
        ('IN_PROGRESS', 'In Progress'), 
        ('IN_TRANSIT', 'In Transit'),
        ('UNDER_REPAIR', 'Under Repair'), 
        ('RESOLVED', 'Resolved'), 
        ('CLOSED', 'Closed'),
        ('ON_HOLD', 'On Hold'),
    ]
    PRIORITY_CHOICES = [('CRITICAL', 'Critical'), ('HIGH', 'High'), ('MEDIUM', 'Medium'), ('LOW', 'Low')]

    ticket_id = models.CharField(max_length=20, unique=True, editable=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submitted_tickets')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets', limit_choices_to={'role': User.TECHNICIAN})
    card = models.ForeignKey(Card, on_delete=models.PROTECT, related_name='tickets', null=True)
    fault_description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='LOW')
    attachment = models.FileField(upload_to=ticket_image_upload_path, blank=True, null=True)
    other_card_type_description = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    in_progress_at = models.DateTimeField(null=True, blank=True)
    in_transit_at = models.DateTimeField(null=True, blank=True)
    under_repair_at = models.DateTimeField(null=True, blank=True)
    on_hold_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    @property
    def sla_days(self):
        if self.priority == 'CRITICAL': return 3
        elif self.priority == 'HIGH': return 7
        elif self.priority == 'MEDIUM': return 14
        elif self.priority == 'LOW': return 21
        return 30

    def save(self, *args, **kwargs):
        if not self.pk:
            super().save(*args, **kwargs)
            self.ticket_id = f"TKT-{self.created_at.year}-{self.id:005d}"
            kwargs['force_insert'] = False
        super(Ticket, self).save(*args, **kwargs)

    def __str__(self):
        return self.ticket_id

class Comment(models.Model):
    text = models.TextField()
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Comment by {self.author.get_username()} on Ticket {self.ticket.ticket_id}"

    class Meta:
        ordering = ['created_at']

class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=50)
    timestamp = models.DateTimeField(default=timezone.now)
    target_object_id = models.CharField(max_length=100, null=True, blank=True)
    details = models.TextField()
    
    # --- FIX 1: Add user_role and ip_address fields ---
    user_role = models.CharField(max_length=20, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.action} at {self.timestamp}"

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['action']),
            models.Index(fields=['timestamp']),
        ]