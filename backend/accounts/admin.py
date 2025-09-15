from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

# This is the advanced way to register your custom User model.
# It provides search, filtering, and a better layout in the admin panel.
class CustomUserAdmin(UserAdmin):
    # You can add 'role' to the list_display to see it in the user list
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'role')
    
    # This makes the 'role' field editable in the admin form
    fieldsets = UserAdmin.fieldsets + (
        ('User Role', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('User Role', {'fields': ('role',)}),
    )

# This line tells the Django admin to use your custom settings for the User model.
admin.site.register(User, CustomUserAdmin)