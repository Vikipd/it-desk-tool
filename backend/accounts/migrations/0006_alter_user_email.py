# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK. THIS IS THE ONLY FILE TO CHANGE.

from django.db import migrations, models

def populate_unique_emails(apps, schema_editor):
    """
    Finds all users with a blank email and assigns them a unique, temporary email
    based on their username to satisfy the new UNIQUE constraint.
    """
    User = apps.get_model('accounts', 'User')
    db_alias = schema_editor.connection.alias
    
    # Get all users where the email field is an empty string
    users_with_blank_email = User.objects.using(db_alias).filter(email__exact='')

    # Loop through each user and update them
    for user in users_with_blank_email:
        # Create a unique, temporary email address
        unique_email = f"{user.username.lower()}_{user.id}@temporary.com"
        user.email = unique_email
        user.save()

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_user_must_change_password_user_phone_number_and_more'),
    ]

    operations = [
        # --- MODIFICATION: Run our data-fixing function FIRST ---
        migrations.RunPython(populate_unique_emails, reverse_code=migrations.RunPython.noop),

        # --- Then, safely alter the field to be unique ---
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(max_length=254, unique=True),
        ),
    ]