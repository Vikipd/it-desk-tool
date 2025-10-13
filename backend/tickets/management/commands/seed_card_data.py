# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT, NON-DESTRUCTIVE BLOCK.

import pandas as pd
from django.core.management.base import BaseCommand
from django.conf import settings
import os
from tickets.models import Card

class Command(BaseCommand):
    help = 'Safely seeds the database with card data from an Excel file. Adds new cards and updates existing ones without deleting any data.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting safe data seeding process...'))
        
        file_path = os.path.join(settings.BASE_DIR, 'card_list.xlsx')
        
        try:
            df = pd.read_excel(file_path)
            self.stdout.write(f'Successfully loaded {len(df)} rows from {file_path}')

            # Clean up column names to be safe
            df.columns = [str(col).strip().lower().replace(' ', '_') for col in df.columns]
            
            # --- THIS IS THE FIX ---
            #
            # The DESTRUCTIVE lines have been REMOVED.
            # We no longer delete any Ticket or Card objects.
            #
            # --- Ticket.objects.all().delete()  <-- REMOVED
            # --- Card.objects.all().delete()    <-- REMOVED
            #
            # Instead, we will use `update_or_create` which is SAFE.
            # It will match cards by `serial_number`. If a card exists, it updates it.
            # If it doesn't exist, it creates it.
            
            created_count = 0
            updated_count = 0

            for index, row in df.iterrows():
                # Skip rows where serial number is missing, as it's our unique key
                if pd.isna(row.get('serial_number')):
                    continue

                # Safely update an existing card or create a new one
                card, created = Card.objects.update_or_create(
                    serial_number=row['serial_number'],
                    defaults={
                        'zone': row.get('zone', ''),
                        'state': row.get('state', ''),
                        'node_type': row.get('node_type', ''),
                        'location': row.get('location', ''),
                        'card_type': row.get('card_type', ''),
                        'slot': str(row.get('slot', '')), # Ensure slot is a string
                        'node_name': row.get('node_name', ''),
                        'primary_ip': row.get('primary_ip', '0.0.0.0'),
                        'aid': row.get('aid', ''),
                        'unit_part_number': row.get('unit_part_number', ''),
                        'clei': row.get('clei', ''),
                    }
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

            self.stdout.write(self.style.SUCCESS(f'Seeding complete. New cards created: {created_count}. Existing cards updated: {updated_count}.'))

        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'Error: The file was not found at {file_path}. Please ensure it is in the backend directory.'))
        except KeyError as e:
            self.stdout.write(self.style.ERROR(f"A required column is missing in the Excel file: {e}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An unexpected error occurred: {e}'))