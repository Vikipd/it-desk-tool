# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from .models import ActivityLog

def log_activity(user, action, target=None, details=""):
    """
    A simple utility to create an activity log entry.
    """
    ActivityLog.objects.create(
        user=user,
        action=action,
        target_object_id=str(target) if target else None,
        details=details
    )