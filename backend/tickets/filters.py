# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import django_filters
from .models import Ticket
from accounts.models import User # Import the User model to reference roles

CARD_TYPE_GROUPS = {
    "Line Cards": ["2UX200", "2UX500"],
    "Client Cards": ["5MX500", "20AX200", "IR9", "IR4 (DWDM)", "ASG (Amplifier)", "8EC2", "32EC2", "20MX80"],
    "Control Cards": ["12XCEC2"],
    "Cross-Connect Cards": ["XST12T"],
}

class MultipleValueFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass

class TicketFilter(django_filters.FilterSet):
    status = MultipleValueFilter(field_name='status', lookup_expr='in')
    card_category_group = django_filters.CharFilter(method='filter_by_main_card_group', label='Main Card Category Group')
    zone = django_filters.CharFilter(field_name='card__zone', lookup_expr='icontains')
    state = django_filters.CharFilter(field_name='card__state', lookup_expr='icontains')
    start_date = django_filters.DateFilter(field_name='created_at', lookup_expr='gte', label='Start Date')
    end_date = django_filters.DateFilter(field_name='created_at', lookup_expr='lte', label='End Date')

    # --- THIS IS THE FIX ---
    # The variable name has been corrected from ROLE_CHOICES to USER_ROLES to match your models.py file.
    created_by__role = django_filters.ChoiceFilter(
        field_name='created_by__role',
        choices=User.USER_ROLES
    )
    assigned_to__role = django_filters.ChoiceFilter(
        field_name='assigned_to__role',
        choices=User.USER_ROLES
    )
    # --- END OF FIX ---

    class Meta:
        model = Ticket
        fields = ['status', 'priority', 'created_by__role', 'assigned_to__role']

    def filter_by_main_card_group(self, queryset, name, value):
        specific_card_types = CARD_TYPE_GROUPS.get(value)
        if specific_card_types:
            return queryset.filter(card__card_type__in=specific_card_types)
        
        if value == 'Other':
            known_types = [item for sublist in CARD_TYPE_GROUPS.values() for item in sublist]
            return queryset.exclude(card__card_type__in=known_types)
            
        return queryset