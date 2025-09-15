from django.urls import path
from .views import CommentListCreateView # <-- Import the new view

urlpatterns = [
    # ... (any other ticket-specific URLs can go here)
    # This URL handles listing and creating comments for a specific ticket
    path('tickets/<int:ticket_pk>/comments/', CommentListCreateView.as_view(), name='ticket-comments'),
]