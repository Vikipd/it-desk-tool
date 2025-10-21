# Path: E:\it-admin-tool\backend\helpdesk\settings\production.py
# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# --- MODIFICATION START: CORRECT PRODUCTION DOMAINS ---

# Explicitly define the allowed hosts for your production domain.
# CORRECTED to use the .io domain.
ALLOWED_HOSTS = [
    'www.hfclotnph4fbportal.io',
    'hfclotnph4fbportal.io',
    '139.59.68.36', # It's good practice to keep the IP address
]

# Explicitly define the frontend origins that are allowed to make API requests.
# This is the fix for the CORS error.
# CORRECTED to use the .io domain.
CORS_ALLOWED_ORIGINS = [
    'https://www.hfclotnph4fbportal.io',
    'https://hfclotnph4fbportal.io',
]

# Production-level security settings. It's recommended to uncomment these
# once you are sure everything is working correctly with HTTPS.
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True

# --- MODIFICATION END ---