# D:\it-admin-tool\backend\tickets\filters.py

import django_filters
from .models import Ticket

CARD_CATEGORY_GROUPS = {
    "Line Cards": ["2UX200", "2UX500"],
    "Client Cards": ["5MX500", "20AX200", "IR9", "IR4 (DWDM)", "ASG (Amplifier)", "8EC2", "32EC2", "20MX80"],
    "Control Cards": ["12XCEC2"],
    "Cross-Connect Cards": ["XST12T"],
}

class TicketFilter(django_filters.FilterSet):
    # These custom filters are defined correctly here.
    card_category = django_filters.CharFilter(method='filter_by_main_card_category', label='Main Card Category')
    start_date = django_filters.DateFilter(field_name='created_at', lookup_expr='gte', label='Start Date')
    end_date = django_filters.DateFilter(field_name='created_at', lookup_expr='lte', label='End Date')

    class Meta:
        model = Ticket
        # --- FIX: The list now ONLY contains actual fields from the Ticket model. ---
        # 'start_date' and 'end_date' have been removed as they are handled by the custom definitions above.
        fields = ['status', 'priority', 'circle', 'node_location']

    def filter_by_main_card_category(self, queryset, name, value):
        specific_cards = CARD_CATEGORY_GROUPS.get(value)
        if specific_cards:
            return queryset.filter(card_category__in=specific_cards)
        if value == 'Other':
            return queryset.filter(card_category='Other')
        # If no specific group matches, and the value isn't 'Other',
        # we do not filter on category to avoid errors.
        return queryset