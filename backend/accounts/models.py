# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
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
    first_name = models.CharField(max_length=150, blank=False)
    last_name = models.CharField(max_length=150, blank=False)
    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(unique=True, blank=False)
    must_change_password = models.BooleanField(default=False)

    def __str__(self):
        return self.username

# --- THIS IS THE MODIFIED MODEL ---
class Contact(models.Model):
    circle = models.CharField(max_length=100)
    name = models.CharField(max_length=200)
    mobile_number = models.CharField(max_length=20)
    email = models.EmailField()

    def __str__(self):
        return f"{self.name} ({self.circle})"

    class Meta:
        ordering = ['circle']