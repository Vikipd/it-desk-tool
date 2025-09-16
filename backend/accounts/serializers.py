from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# --- NEW: Self-Service Password Change Serializer ---
# This is for a user changing their OWN password after the first login.
class ChangePasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    def update(self, instance, validated_data):
        # Set the new password
        instance.set_password(validated_data['password'])
        # IMPORTANT: Turn off the force-change flag
        instance.must_change_password = False
        instance.save()
        return instance

# --- User Creation Serializer ---
class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'phone_number', 'role', 'password')
        extra_kwargs = {
            'password': {'write_only': True, 'required': True, 'validators': [validate_password]},
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number', ''),
            role=validated_data['role']
        )
        user.set_password(validated_data['password'])
        user.must_change_password = True
        user.save()
        return user

# --- User Update Serializer ---
# --- THIS IS THE FIX: Added 'username' to the fields list ---
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Admins can now update all core user details except the password from this form.
        fields = ('id', 'username', 'first_name', 'last_name', 'phone_number', 'role')
        extra_kwargs = {
            # Last name is not required by the model, so no change is needed here.
            # We will handle the visual '*' on the frontend.
            'username': {'required': False},
            'first_name': {'required': False},
        }

# --- Admin Password Reset Serializer ---
class AdminPasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    def update(self, instance, validated_data):
        instance.set_password(validated_data['password'])
        instance.must_change_password = True
        instance.save()
        return instance

# --- User Detail Serializer (for viewing) ---
class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'full_name', 'phone_number', 'email', 'role', 'must_change_password', 'is_active')

    def get_full_name(self, obj):
        return obj.get_full_name()

# --- Token Serializer (for Login) ---
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = 'ADMIN' if user.is_superuser else user.role
        token['must_change_password'] = user.must_change_password
        return token