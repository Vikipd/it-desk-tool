# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from tickets.models import ActivityLog

class Command(BaseCommand):
    help = 'Purges activity log entries older than a specified number of days.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Delete log entries older than this many days.',
        )

    def handle(self, *args, **options):
        days = options['days']
        cutoff_date = timezone.now() - timedelta(days=days)
        
        logs_to_delete = ActivityLog.objects.filter(timestamp__lt=cutoff_date)
        count = logs_to_delete.count()
        
        if count > 0:
            logs_to_delete.delete()
            self.stdout.write(self.style.SUCCESS(f'Successfully purged {count} activity log entries older than {days} days.'))
        else:
            self.stdout.write(self.style.SUCCESS('No old activity log entries to purge.'))