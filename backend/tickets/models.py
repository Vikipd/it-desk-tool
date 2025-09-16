from django.db import models
from django.conf import settings
from django.utils import timezone
from accounts.models import User

# --- NEW MODEL: To store all the data from your Excel file ---
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

# Helper function for file uploads
def ticket_image_upload_path(instance, filename):
    return f"tickets/{instance.ticket_id}/{filename}"

# --- HEAVILY MODIFIED TICKET MODEL ---
class Ticket(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'), 
        ('IN_PROGRESS', 'In Progress'), 
        ('IN_TRANSIT', 'In Transit'),
        ('UNDER_REPAIR', 'Under Repair'), 
        ('RESOLVED', 'Resolved'), 
        ('CLOSED', 'Closed'),
        ('ON_HOLD', 'On Hold'), # Added for Engineer's "Other" option
    ]
    PRIORITY_CHOICES = [('CRITICAL', 'Critical'), ('HIGH', 'High'), ('MEDIUM', 'Medium'), ('LOW', 'Low')]

    # --- Core Ticket Information ---
    ticket_id = models.CharField(max_length=20, unique=True, editable=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submitted_tickets')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets', limit_choices_to={'role': User.TECHNICIAN})
    
    # --- Link to the card data ---
    card = models.ForeignKey(Card, on_delete=models.PROTECT, related_name='tickets', null=True)
    
    # --- User-provided details ---
    fault_description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='LOW')
    attachment = models.FileField(upload_to=ticket_image_upload_path, blank=True, null=True)
    other_card_type_description = models.CharField(max_length=100, blank=True, null=True)

    # --- Status and Timestamps ---
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Engineer Timestamps
    assigned_at = models.DateTimeField(null=True, blank=True)
    in_progress_at = models.DateTimeField(null=True, blank=True)
    in_transit_at = models.DateTimeField(null=True, blank=True)
    under_repair_at = models.DateTimeField(null=True, blank=True)
    on_hold_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Admin Timestamp
    closed_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Generate Ticket ID on first save
        if not self.pk:
            super().save(*args, **kwargs) # Save to get a PK
            self.ticket_id = f"TKT-{self.created_at.year}-{self.id:005d}"
            kwargs['force_insert'] = False # Ensure we update not insert again
        
        super(Ticket, self).save(*args, **kwargs)

    def __str__(self):
        return self.ticket_id

# --- Comment Model (Unchanged) ---
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