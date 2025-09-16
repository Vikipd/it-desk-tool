from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # This single line handles all authentication URLs (e.g., /api/token/, etc.)
    # It will look inside 'accounts/urls.py' for the specific paths.
    path('api/', include('accounts.urls')),

    # This single line handles ALL ticket-related URLs (e.g., /api/tickets/, /api/cards/zones/, etc.)
    # It will look inside 'tickets/urls.py' for all the specific paths.
    path('api/', include('tickets.urls')),
]

# This correctly adds the URL for serving uploaded media files in development.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)