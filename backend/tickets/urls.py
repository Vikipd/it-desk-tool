# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from django.urls import path
from .views import (
    ZoneListView, StateListView, NodeTypeListView, LocationListView, 
    CardTypeListView, SlotListView, CardAutofillView, FilteredCardDataView,
    TicketViewSet, CommentViewSet, ActivityLogViewSet
)

ticket_list = TicketViewSet.as_view({'get': 'list', 'post': 'create'})
ticket_detail = TicketViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})
ticket_dashboard_stats = TicketViewSet.as_view({'get': 'dashboard_stats'})
ticket_export = TicketViewSet.as_view({'get': 'export_all'})
comment_list = CommentViewSet.as_view({'get': 'list', 'post': 'create'})
activity_log_list = ActivityLogViewSet.as_view({'get': 'list'})
# --- THIS IS THE FIX ---
activity_log_export = ActivityLogViewSet.as_view({'get': 'export'})

urlpatterns = [
    # Dropdown URLs
    path('zones/', ZoneListView.as_view(), name='zone-list'),
    path('states/', StateListView.as_view(), name='state-list'),
    path('node-types/', NodeTypeListView.as_view(), name='nodetype-list'),
    path('locations/', LocationListView.as_view(), name='location-list'),
    path('card-types/', CardTypeListView.as_view(), name='card-type-list'),
    path('slots/', SlotListView.as_view(), name='slot-list'),
    path('card-autofill/', CardAutofillView.as_view(), name='card-autofill'),
    path('card-data/<str:field_name>/', FilteredCardDataView.as_view(), name='filtered-card-data'),

    # Custom Action URLs
    path('dashboard-stats/', ticket_dashboard_stats, name='ticket-dashboard-stats'),
    path('export-all/', ticket_export, name='ticket-export-all'),

    # Main Ticket CRUD URLs
    path('', ticket_list, name='ticket-list'),
    path('<int:pk>/', ticket_detail, name='ticket-detail'),

    # Nested Comment URLs
    path('<int:ticket_pk>/comments/', comment_list, name='ticket-comments-list'),

    # Activity Log URLs
    path('activity-log/', activity_log_list, name='activity-log-list'),
    path('activity-log/export/', activity_log_export, name='activity-log-export'),
]