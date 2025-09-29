# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK. THE FILTER IS FIXED.

import django_filters
from .models import Ticket, Card

CARD_TYPE_GROUPS = {
    "Line Cards": ["2UX200", "2UX500"],
    "Client Cards": ["5MX500", "20AX200", "IR9", "IR4 (DWDM)", "ASG (Amplifier)", "8EC2", "32EC2", "20MX80"],
    "Control Cards": ["12XCEC2"],
    "Cross-Connect Cards": ["XST12T"],
}

# --- MODIFICATION: THIS IS A NEW HELPER CLASS TO HANDLE MULTIPLE VALUES ---
class MultipleValueFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    """
    Custom filter to handle comma-separated values for 'in' lookups.
    For example: ?status=IN_PROGRESS,ON_HOLD
    """
    pass

class TicketFilter(django_filters.FilterSet):
    # --- MODIFICATION: THE 'status' FIELD NOW USES OUR NEW CUSTOM FILTER ---
    status = MultipleValueFilter(field_name='status', lookup_expr='in')
    
    card_category_group = django_filters.CharFilter(method='filter_by_main_card_group', label='Main Card Category Group')
    zone = django_filters.CharFilter(field_name='card__zone', lookup_expr='icontains')
    state = django_filters.CharFilter(field_name='card__state', lookup_expr='icontains')
    start_date = django_filters.DateFilter(field_name='created_at', lookup_expr='gte', label='Start Date')
    end_date = django_filters.DateFilter(field_name='created_at', lookup_expr='lte', label='End Date')

    class Meta:
        model = Ticket
        # --- We add 'status' here so it can be overridden by our custom filter ---
        fields = ['status', 'priority']

    def filter_by_main_card_group(self, queryset, name, value):
        specific_card_types = CARD_TYPE_GROUPS.get(value)
        if specific_card_types:
            return queryset.filter(card__card_type__in=specific_card_types)
        
        if value == 'Other':
            known_types = [item for sublist in CARD_TYPE_GROUPS.values() for item in sublist]
            return queryset.exclude(card__card_type__in=known_types)
            
        return queryset