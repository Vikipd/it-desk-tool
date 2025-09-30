# E:\it-admin-tool\backend\helpdesk\wsgi.py

import os
from django.core.wsgi import get_wsgi_application

# --- FINAL FIX ---
# This correctly points to the production settings for the live server.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'helpdesk.settings.production')

application = get_wsgi_application()