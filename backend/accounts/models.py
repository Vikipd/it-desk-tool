from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # Define user roles
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
    # Add other custom fields if needed

    def __str__(self):
        return self.username
