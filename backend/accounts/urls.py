# Path: E:\it-admin-tool\backend\accounts\urls.py
# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    MyTokenObtainPairView,
    LogoutView,
    UserListCreateView,
    UserRetrieveUpdateDestroyAPIView,
    RestoreUserView,
    AdminPasswordResetView,
    UserDetailView,
    TechnicianListView,
    ChangePasswordView,
    UserDetailsValidationView,
    ContactListView,
    ContactExportView,
)

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserRetrieveUpdateDestroyAPIView.as_view(), name='user-detail'),
    path('users/<int:pk>/restore/', RestoreUserView.as_view(), name='user-restore'),
    path('users/<int:pk>/reset-password/', AdminPasswordResetView.as_view(), name='admin-password-reset'),
    path('me/', UserDetailView.as_view(), name='user-me'),
    path('technicians/', TechnicianListView.as_view(), name='technician-list'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    # --- THIS IS THE FIX ---
    # The URL has been corrected to match what the frontend is calling.
    path('validate-user-details/', UserDetailsValidationView.as_view(), name='validate-user-details'),
    path('contacts/', ContactListView.as_view(), name='contact-list'),
    path('contacts/export/', ContactExportView.as_view(), name='contact-export'),
]