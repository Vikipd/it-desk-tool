# D:\it-admin-tool\backend\accounts\serializers.py

from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# This serializer is for creating or viewing user details
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'email', 'role')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            role=validated_data.get('role', 'CLIENT')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

# This is the serializer we use for customizing the login token
# D:\it-admin-tool\backend\accounts\serializers.py (Corrected Class)

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        
        # This is the new, more intelligent logic.
        # It checks if the user is a superuser first.
        if user.is_superuser:
            token['role'] = 'ADMIN'
        else:
            # For any other user, it uses the role from the database.
            token['role'] = user.role 

        return token