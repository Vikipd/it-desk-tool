# COPY AND PASTE THIS ENTIRE BLOCK INTO: backend/manage.py

#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

def main():
    """Run administrative tasks."""
    # --- MODIFICATION START ---
    # We read an environment variable to decide which settings to use.
    # If the variable is not set, it defaults to 'local'.
    # This ensures 'runserver' always uses your local settings.
    environment = os.environ.get('DJANGO_ENV', 'local')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'helpdesk.settings.production')
    # --- MODIFICATION END ---
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()