# COPY AND PASTE THIS ENTIRE BLOCK. THIS IS THE FINAL AND CORRECT SEEDING SCRIPT.

import pandas as pd
from django.core.management.base import BaseCommand
from django.conf import settings
import os
from tickets.models import Card, Ticket # --- FIX: Import the Ticket model ---
import numpy as np

class Command(BaseCommand):
    help = 'Seeds the database with card data from an Excel file'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting data seeding process...'))
        
        file_path = os.path.join(settings.BASE_DIR, 'card_list.xlsx')
        
        try:
            df = pd.read_excel(file_path)
            self.stdout.write(f'Successfully loaded {len(df)} rows from {file_path}')

            original_columns = df.columns
            df.columns = [str(col).strip().lower().replace(' ', '_').replace('(', '').replace(')', '') for col in df.columns]
            
            column_map = {new: old for new, old in zip(df.columns, original_columns)}
            
            key_column = 'serial_number'

            df.dropna(subset=[key_column], inplace=True)
            
            initial_rows = len(df)
            df.drop_duplicates(subset=[key_column], keep='first', inplace=True)
            final_rows = len(df)

            if initial_rows > final_rows:
                self.stdout.write(self.style.WARNING(f'Removed {initial_rows - final_rows} duplicate rows based on Serial Number.'))

            # --- THIS IS THE FINAL FIX: Delete old tickets BEFORE deleting old cards ---
            self.stdout.write(self.style.WARNING('Clearing existing ticket data to remove foreign key constraints...'))
            Ticket.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Successfully cleared existing ticket data.'))
            # --- END OF FIX ---
            
            Card.objects.all().delete()
            self.stdout.write('Cleared existing card data.')

            cards_to_create = []
            for index, row in df.iterrows():
                cards_to_create.append(
                    Card(
                        zone=row.get('zone', ''),
                        state=row.get('state', ''),
                        node_type=row.get('node_type', ''),
                        location=row.get('location', ''),
                        card_type=row.get('card_type', ''),
                        slot=row.get('slot', ''),
                        node_name=row.get('node_name', ''),
                        primary_ip=row.get('primary_ip', '0.0.0.0'),
                        aid=row.get('aid', ''),
                        unit_part_number=row.get('unit_part_number', ''),
                        clei=row.get('clei', ''),
                        serial_number=row.get('serial_number')
                    )
                )

            Card.objects.bulk_create(cards_to_create)
            
            self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(cards_to_create)} valid and unique card records into the database.'))

        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'Error: The file was not found at {file_path}. Please ensure it is in the backend directory.'))
        except KeyError as e:
            clean_key = str(e).strip("'")
            original_key = column_map.get(clean_key, f"'{clean_key}' (clean name)")
            self.stdout.write(self.style.ERROR(f"A required column is missing. The script could not find the column corresponding to {original_key}."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An unexpected error occurred: {e}'))