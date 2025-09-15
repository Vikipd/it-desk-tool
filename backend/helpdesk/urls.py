from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from tickets.views import TicketViewSet

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')

urlpatterns = [
    path('admin/', admin.site.urls),

    # FIX: This single line will now handle ALL authentication-related URLs
    # including /api/token/, /api/token/refresh/, and /api/auth/me/
    path('api/', include('accounts.urls')),

    path('api/', include(router.urls)),

    # This correctly handles all Ticket-related endpoints
    path('api/', include('tickets.urls')),
]

# Media (for image uploads) - This part is correct
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)