# Path: E:\it-admin-tool\backend\helpdesk\settings\production.py
# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# --- MODIFICATION START: CORRECT AND FORTIFY PRODUCTION DOMAINS ---

# Add ALL possible production domains to the allowed hosts list.
ALLOWED_HOSTS = [
    'www.hfclotnph4fbportal.in',
    'hfclotnph4fbportal.in',
    'www.hfclotnph4fbportal.io',
    'hfclotnph4fbportal.io',
    '139.59.68.36', # Keep the server IP address
]

# Add ALL possible frontend origins that are allowed to make API requests.
# This ensures that no matter which domain you use, the CORS policy will pass.
CORS_ALLOWED_ORIGINS = [
    'https://www.hfclotnph4fbportal.in',
    'https://hfclotnph4fbportal.in',
    'https://www.hfclotnph4fbportal.io',
    'https://hfclotnph4fbportal.io',
]

# Production-level security settings.
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True

# --- MODIFICATION END ---