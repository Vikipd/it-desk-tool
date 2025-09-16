from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # --- Existing User Roles (Unchanged) ---
    CLIENT = 'CLIENT'
    TECHNICIAN = 'TECHNICIAN'
    ADMIN = 'ADMIN'
    OBSERVER = 'OBSERVER'
    USER_ROLES = (
        (CLIENT, 'Client'),
        (TECHNICIAN, 'Technician'),
        (ADMIN, 'Admin'),
        (OBSERVER, 'Observer'),
    )
    role = models.CharField(max_length=10, choices=USER_ROLES, default=CLIENT)

    # --- NEW FIELDS ---
    # We make first_name and last_name required by setting blank=False
    first_name = models.CharField(max_length=150, blank=False)
    last_name = models.CharField(max_length=150, blank=False)
    phone_number = models.CharField(max_length=20, blank=True) # Optional field

    # --- NEW FEATURE: Force Password Reset ---
    # This field will be set to True by an admin.
    # The user must change their password before they can do anything else.
    must_change_password = models.BooleanField(default=False)

    def __str__(self):
        return self.username