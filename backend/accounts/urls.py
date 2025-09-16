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
    ChangePasswordView # <-- MODIFICATION: Import the new view
)

urlpatterns = [
    # --- Authentication ---
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserDetailView.as_view(), name='user-detail'),
    
    # --- NEW: Self-service password change URL ---
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),

    # --- User Management (for Admins) ---
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserRetrieveUpdateDestroyView.as_view(), name='user-retrieve-update-destroy'),
    path('users/<int:pk>/restore/', RestoreUserView.as_view(), name='user-restore'),
    path('users/<int:pk>/reset-password/', AdminPasswordResetView.as_view(), name='admin-password-reset'),

    # --- Utility ---
    path('technicians/', TechnicianListView.as_view(), name='technician-list'),
]