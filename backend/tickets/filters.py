import django_filters
from .models import Ticket, Card

# This dictionary is now used for grouping and can be expanded later if needed.
# For now, the main purpose is to demonstrate the filtering logic.
CARD_TYPE_GROUPS = {
    "Line Cards": ["2UX200", "2UX500"],
    "Client Cards": ["5MX500", "20AX200", "IR9", "IR4 (DWDM)", "ASG (Amplifier)", "8EC2", "32EC2", "20MX80"],
    "Control Cards": ["12XCEC2"],
    "Cross-Connect Cards": ["XST12T"],
}

class TicketFilter(django_filters.FilterSet):
    # --- MODIFICATION START: Update filters to use the related Card model ---
    
    # Filter by the main category group of the card_type
    card_category_group = django_filters.CharFilter(method='filter_by_main_card_group', label='Main Card Category Group')
    
    # Direct filter for the Zone field on the related Card model
    zone = django_filters.CharFilter(field_name='card__zone', lookup_expr='icontains')
    
    # Direct filter for the State field on the related Card model
    state = django_filters.CharFilter(field_name='card__state', lookup_expr='icontains')

    # Date filters remain the same and are correct
    start_date = django_filters.DateFilter(field_name='created_at', lookup_expr='gte', label='Start Date')
    end_date = django_filters.DateFilter(field_name='created_at', lookup_expr='lte', label='End Date')

    class Meta:
        model = Ticket
        # --- FIX: The list now contains only fields directly on the Ticket model ---
        # We removed 'circle' and 'node_location' and will handle card-related
        # filters with the custom definitions above.
        fields = ['status', 'priority']

    def filter_by_main_card_group(self, queryset, name, value):
        # This method now filters based on the 'card_type' of the related Card
        specific_card_types = CARD_TYPE_GROUPS.get(value)
        if specific_card_types:
            return queryset.filter(card__card_type__in=specific_card_types)
        
        # Handle the 'Other' case if you have a special value for it
        if value == 'Other':
            # This logic assumes 'Other' is a specific value in your 'card_type' column.
            # If not, you might need to exclude all known types.
            known_types = [item for sublist in CARD_TYPE_GROUPS.values() for item in sublist]
            return queryset.exclude(card__card_type__in=known_types)
            
        return queryset