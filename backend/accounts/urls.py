# D:\it-admin-tool\backend\accounts\urls.py

from django.urls import path

# Import the views from the accounts app
from .views import (
    MyTokenObtainPairView,  # <-- CORRECTED: Use the new view name for login
    UserDetailView,
    UserListCreateView,
    TechnicianListView
)

# Import the standard refresh view from the simple-jwt library
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # This URL handles the login request: /api/token/
    # It now correctly points to our custom view.
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # This URL handles the token refresh request: /api/token/refresh/
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # This URL handles fetching the current user's profile: /api/auth/me/
    path('auth/me/', UserDetailView.as_view(), name='user-detail'),
    
    # This URL will handle listing and creating users (for admins).
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    
    # This URL will handle listing all technicians (for admins).
    path('technicians/', TechnicianListView.as_view(), name='technician-list'),
]