# D:\it-admin-tool\backend\tickets\models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
from accounts.models import User

# This function is correct.
def ticket_image_upload_path(instance, filename):
    return f"tickets/{instance.ticket_id}/{filename}"

class Ticket(models.Model):
    # --- All choices and fields are correctly defined ---
    STATUS_CHOICES = [
        ('OPEN', 'Open'), ('IN_PROGRESS', 'In Progress'), ('IN_TRANSIT', 'In Transit'),
        ('UNDER_REPAIR', 'Under Repair'), ('RESOLVED', 'Resolved'), ('CLOSED', 'Closed'),
    ]
    PRIORITY_CHOICES = [
        ('CRITICAL', 'Critical'), ('HIGH', 'High'), ('MEDIUM', 'Medium'), ('LOW', 'Low'),
    ]
    ticket_id = models.CharField(max_length=20, unique=True, editable=False)
    node_name = models.CharField(max_length=100)
    card_serial_number = models.CharField(max_length=100)
    circle = models.CharField(max_length=50)
    ba_oa = models.CharField(max_length=50)
    node_location = models.CharField(max_length=100)
    card_category = models.CharField(max_length=50)
    fault_description = models.TextField()
    attachment = models.FileField(upload_to=ticket_image_upload_path, blank=True, null=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='LOW')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submitted_tickets')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_tickets', limit_choices_to={'role': User.TECHNICIAN} 
    )
    closed_at = models.DateTimeField(null=True, blank=True)

    # ==============================================================================
    # --- START OF THE FIX: This save method contains the new, robust logic ---
    # ==============================================================================
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        
        # --- FIX: Define the statuses that stop the SLA clock ---
        sla_complete_statuses = ['RESOLVED', 'CLOSED']

        # If the status is being changed to a "complete" status, and the closed_at timestamp isn't already set, set it now.
        if self.status in sla_complete_statuses and self.closed_at is None:
            self.closed_at = timezone.now()
        # If the status is changed FROM a "complete" status back to an open one (i.e., ticket is reopened), clear the timestamp.
        elif self.status not in sla_complete_statuses and self.closed_at is not None:
            self.closed_at = None
        
        # Handle ticket ID generation for new tickets.
        if is_new:
            # We must call save() first to generate a primary key (self.id).
            super().save(*args, **kwargs)
            # Now we can create the unique ticket_id.
            self.ticket_id = f"TKT-{self.created_at.year}-{self.id:005d}"
            # We set force_insert=False to prevent creating a duplicate record.
            kwargs['force_insert'] = False
        
        # Finally, call the original save method to save all changes.
        super(Ticket, self).save(*args, **kwargs)
    # ==============================================================================
    # --- END OF THE FIX ---
    # ==============================================================================

    def __str__(self):
        return self.ticket_id

class Comment(models.Model):
    # This model is fine, no changes needed.
    text = models.TextField()
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        author_username = self.author.get_username() if self.author else "Unknown Author"
        ticket_id = self.ticket.ticket_id if self.ticket else "Unknown Ticket"
        return f"Comment by {author_username} on Ticket {ticket_id}"
    class Meta:
        ordering = ['created_at']