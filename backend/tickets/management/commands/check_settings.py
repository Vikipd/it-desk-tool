# E:\it-admin-tool\backend\tickets\management\commands\check_settings.py

from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = 'Prints the current values of key production settings'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('--- Checking Live Django Settings ---'))
        
        allowed_hosts = getattr(settings, 'ALLOWED_HOSTS', 'NOT SET')
        self.stdout.write(f"ALLOWED_HOSTS = {allowed_hosts}")
        
        cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', 'NOT SET')
        self.stdout.write(f"CORS_ALLOWED_ORIGINS = {cors_origins}")
        
        debug_status = getattr(settings, 'DEBUG', 'NOT SET')
        self.stdout.write(f"DEBUG = {debug_status}")
        
        self.stdout.write(self.style.SUCCESS('--- Check Complete ---'))