# E:\it-admin-tool\backend\gunicorn_config.py

import os

# Force the use of the production settings module. This is non-negotiable.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'helpdesk.settings.production')

# Standard Gunicorn settings
workers = 3
bind = "unix:/run/gunicorn.sock"