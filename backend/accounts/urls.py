# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    MyTokenObtainPairView,
    UserDetailView,
    UserListCreateView,
    TechnicianListView,
    UserRetrieveUpdateDestroyView,
    AdminPasswordResetView,
    RestoreUserView,
    ChangePasswordView,
    UserDetailsValidationView,
    ContactListView,
    ContactExportView # Add the new export view
)

urlpatterns = [
    # ... (all other URLs remain the same)
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserDetailView.as_view(), name='user-detail'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('auth/validate-user-details/', UserDetailsValidationView.as_view(), name='validate-user-details'),
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserRetrieveUpdateDestroyView.as_view(), name='user-retrieve-update-destroy'),
    path('users/<int:pk>/restore/', RestoreUserView.as_view(), name='user-restore'),
    path('users/<int:pk>/reset-password/', AdminPasswordResetView.as_view(), name='admin-password-reset'),
    path('technicians/', TechnicianListView.as_view(), name='technician-list'),
    
    # --- THIS IS THE FIX ---
    path('contacts/', ContactListView.as_view(), name='contact-list'),
    path('contacts/export/', ContactExportView.as_view(), name='contact-export'), # New URL for exporting
]