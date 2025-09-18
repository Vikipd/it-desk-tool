# E:\it-admin-tool\backend\accounts\permissions.py

from rest_framework import permissions
from .models import User

class IsAdminRole(permissions.BasePermission):
    """
    Custom permission to only allow users with the ADMIN role.
    This is the single source of truth for what an "Admin" can do.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_superuser or 
            (hasattr(request.user, 'role') and request.user.role == User.ADMIN)
        )

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow Admins to edit, but anyone to view.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user.
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Write permissions (POST, PUT, DELETE) are only allowed to Admins.
        return request.user and request.user.is_authenticated and (
            request.user.is_superuser or
            (hasattr(request.user, 'role') and request.user.role == User.ADMIN)
        )