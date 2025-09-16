#### **Step 1.3: Complete `tickets/urls.py`**

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TicketViewSet, 
    CommentViewSet,
    ZoneListView,
    StateListView,
    NodeTypeListView,
    LocationListView,
    CardTypeListView,
    SlotListView,
    CardAutofillView,
    FilteredCardDataView,
)

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'tickets/(?P<ticket_pk>[^/.]+)/comments', CommentViewSet, basename='ticket-comment')

urlpatterns = [
    path('cards/zones/', ZoneListView.as_view(), name='card-zones'),
    path('cards/states/', StateListView.as_view(), name='card-states'),
    path('cards/node-types/', NodeTypeListView.as_view(), name='card-node-types'),
    path('cards/locations/', LocationListView.as_view(), name='card-locations'),
    path('cards/card-types/', CardTypeListView.as_view(), name='card-card-types'),
    path('cards/slots/', SlotListView.as_view(), name='card-slots'),
    path('cards/autofill/', CardAutofillView.as_view(), name='card-autofill'),
    
    # NEW URL for getting filtered manual dropdown options
    path('cards/filtered-data/<str:field_name>/', FilteredCardDataView.as_view(), name='filtered-card-data'),
    
    path('', include(router.urls)),
]