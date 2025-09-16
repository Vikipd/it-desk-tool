# COPY AND PASTE THIS ENTIRE BLOCK INTO: backend/helpdesk/wsgi.py

import os
from django.core.wsgi import get_wsgi_application

# --- MODIFICATION START ---
# We configure this file to specifically use the production settings.
# Our live server configuration will point to this file.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'helpdesk.settings.production')
# --- MODIFICATION END ---

application = get_wsgi_application()