from django.contrib import admin
from .models import Ticket

# This custom admin view makes it much easier to manage tickets
class TicketAdmin(admin.ModelAdmin):
    # Columns to display in the ticket list view
    list_display = ('ticket_id', 'status', 'priority', 'created_by', 'assigned_to', 'created_at')
    
    # Fields to filter by on the right side
    list_filter = ('status', 'priority', 'created_at')

    # Fields to search by
    search_fields = ('ticket_id', 'fault_description', 'created_by__username', 'assigned_to__username')
    
    # Make date fields read-only
    readonly_fields = ('created_at', 'updated_at')

# Register your Ticket model with the custom admin view
admin.site.register(Ticket, TicketAdmin)