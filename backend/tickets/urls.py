# Path: E:\it-admin-tool\backend\tickets\urls.py
# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from django.urls import path
from .views import (
    ZoneListView, StateListView, NodeTypeListView, LocationListView, 
    CardTypeListView, SlotListView, CardAutofillView, FilteredCardDataView,
    TicketViewSet, CommentViewSet, ActivityLogViewSet
)

# This is a restoration of your original, working URL structure, plus the one required fix.
# There are no routers. Every URL is manually and explicitly defined.

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

    # Custom Ticket Action URLs
    path('dashboard-stats/', TicketViewSet.as_view({'get': 'dashboard_stats'}), name='ticket-dashboard-stats'),
    path('export-all/', TicketViewSet.as_view({'get': 'export_all'}), name='ticket-export-all'),

    # Main Ticket CRUD URLs
    path('', TicketViewSet.as_view({'get': 'list', 'post': 'create'}), name='ticket-list'),
    path('<int:pk>/', TicketViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='ticket-detail'),
    path('<int:pk>/edit-timestamps/', TicketViewSet.as_view({'patch': 'edit_timestamps'}), name='ticket-edit-timestamps'),
    path('<int:pk>/update-status-with-comment/', TicketViewSet.as_view({'post': 'update_status_with_comment'}), name='ticket-update-status-with-comment'),

    # Nested Comment URLs
    path('<int:ticket_pk>/comments/', CommentViewSet.as_view({'get': 'list', 'post': 'create'}), name='ticket-comments-list'),

    # --- THIS IS THE ONE AND ONLY FIX THAT WAS EVER NEEDED ---
    # Activity Log URLs
    path('activity-log/', ActivityLogViewSet.as_view({'get': 'list'}), name='activity-log-list'),
    path('activity-log/export/', ActivityLogViewSet.as_view({'get': 'export'}), name='activity-log-export'),
]