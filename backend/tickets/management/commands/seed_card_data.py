import pandas as pd
from django.core.management.base import BaseCommand
from tickets.models import Card
import numpy as np

class Command(BaseCommand):
    help = 'Seeds the database with card data from an Excel file'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting data seeding process...'))
        
        file_path = 'card_list.xlsx'
        
        try:
            df = pd.read_excel(file_path)
            self.stdout.write(f'Successfully loaded {len(df)} rows from {file_path}')

            # --- THIS IS THE GUARANTEED FIX ---
            # 1. Standardize all column names: remove whitespace, convert to lowercase.
            # This makes the script immune to formatting errors in the Excel file.
            original_columns = df.columns
            df.columns = [col.strip().lower().replace(' ', '_') for col in df.columns]
            
            # Create a mapping from new clean names back to original names for clarity if needed
            column_map = {new: old for new, old in zip(df.columns, original_columns)}
            
            # The key column for validation is now 'serial_number'
            key_column = 'serial_number'

            # 2. Drop any rows where the essential 'serial_number' column is empty.
            df.dropna(subset=[key_column], inplace=True)
            
            # 3. Remove any duplicate rows based on the unique 'serial_number'.
            initial_rows = len(df)
            df.drop_duplicates(subset=[key_column], keep='first', inplace=True)
            final_rows = len(df)

            if initial_rows > final_rows:
                self.stdout.write(self.style.WARNING(f'Removed {initial_rows - final_rows} duplicate rows based on Serial Number.'))
            # --- END OF FIX ---

            Card.objects.all().delete()
            self.stdout.write('Cleared existing card data.')

            cards_to_create = []
            # Now, we use the clean, standardized column names to access the data.
            for index, row in df.iterrows():
                cards_to_create.append(
                    Card(
                        zone=row['zone'],
                        state=row['state'],
                        node_type=row['node_type'],
                        location=row['location'],
                        card_type=row['card_type'],
                        slot=row['slot'],
                        node_name=row['node_name'],
                        primary_ip=row['primary_ip'],
                        aid=row['aid'],
                        unit_part_number=row['unit_part_number'],
                        clei=row['clei'],
                        serial_number=row['serial_number']
                    )
                )

            Card.objects.bulk_create(cards_to_create)
            
            self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(cards_to_create)} valid and unique card records into the database.'))

        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'Error: The file was not found at {file_path}.'))
        except KeyError as e:
            # This will now give a much more helpful error message.
            clean_key = str(e).strip("'")
            original_key = column_map.get(clean_key, f"'{clean_key}' (clean name)")
            self.stdout.write(self.style.ERROR(f"A required column is missing. The script could not find the column corresponding to {original_key}."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An unexpected error occurred: {e}'))