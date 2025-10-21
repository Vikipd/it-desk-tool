# Path: E:\it-admin-tool\backend\tickets\activity_logger.py
# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from .models import ActivityLog
from django.contrib.auth.models import AnonymousUser

def get_client_ip(request):
    """Get the client's real IP address from the request."""
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def log_activity(user, action, request=None, target=None, details=""):
    """
    The final, correct utility to create an activity log entry.
    It takes the user and the request separately for maximum flexibility.
    """
    if not user or not user.is_authenticated or isinstance(user, AnonymousUser):
        return

    ActivityLog.objects.create(
        user=user,
        user_role=user.role,
        ip_address=get_client_ip(request), # Get IP from the optional request
        action=action,
        target_object_id=str(target) if target else None,
        details=details
    )