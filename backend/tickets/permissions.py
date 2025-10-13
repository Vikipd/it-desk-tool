# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from rest_framework import permissions
from accounts.models import User

class IsAdminOrObserver(permissions.BasePermission):
    """
    Custom permission to only allow Admins or Observers to access a view.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user,
        # so we'll check for safe methods (GET, HEAD, OPTIONS).
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated and \
                   (request.user.role == User.ADMIN or request.user.role == User.OBSERVER)
        
        # Write permissions are only allowed to admins.
        return request.user and request.user.is_authenticated and request.user.role == User.ADMIN