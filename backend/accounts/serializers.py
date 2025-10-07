# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
# --- MODIFICATION START ---
from rest_framework_simplejwt.exceptions import AuthenticationFailed
# --- MODIFICATION END ---

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['user_id'] = user.id
        token['role'] = user.role
        token['must_change_password'] = user.must_change_password
        return token

    # --- MODIFICATION START: OVERRIDE VALIDATE METHOD FOR SPECIFIC ERRORS ---
    def validate(self, attrs):
        username = attrs.get(self.username_field)
        password = attrs.get('password')

        # Step 1: Check if a user with the given username exists.
        try:
            user = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            raise AuthenticationFailed("No active account found with this username.")

        # Step 2: Check if the user's account is active.
        if not user.is_active:
            raise AuthenticationFailed("This user account has been deactivated.")

        # Step 3: Check if the password is correct for the user.
        if not user.check_password(password):
            raise AuthenticationFailed("Incorrect password. Please try again.")

        # If all checks pass, use the parent class's logic to generate the token.
        data = super().validate(attrs)
        return data
    # --- MODIFICATION END ---


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name', 'phone_number', 'role')
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        if User.objects.filter(email__iexact=attrs['email']).exists():
            raise serializers.ValidationError({"email": "A user with that email already exists."})
        first_name = attrs.get('first_name', '')
        last_name = attrs.get('last_name', '')
        if any(char.isdigit() for char in first_name):
            raise serializers.ValidationError({"first_name": "First name cannot contain numbers."})
        if last_name and any(char.isdigit() for char in last_name):
            raise serializers.ValidationError({"last_name": "Last name cannot contain numbers."})
        return attrs
    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number'),
            role=validated_data.get('role', User.CLIENT)
        )
        user.set_password(validated_data['password'])
        if validated_data.get('role') == User.ADMIN:
            user.must_change_password = False
        else:
            user.must_change_password = True
        user.save()
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'phone_number', 'role']
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value
    def validate(self, attrs):
        first_name = attrs.get('first_name', self.instance.first_name)
        last_name = attrs.get('last_name', self.instance.last_name)
        if any(char.isdigit() for char in first_name):
            raise serializers.ValidationError({"first_name": "First name cannot contain numbers."})
        if last_name and any(char.isdigit() for char in last_name):
            raise serializers.ValidationError({"last_name": "Last name cannot contain numbers."})
        return attrs

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'phone_number', 'role', 'is_active', 'must_change_password')
    def get_full_name(self, obj):
        return obj.get_full_name()

class AdminPasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    def update(self, instance, validated_data):
        instance.set_password(validated_data['password'])
        if instance.role == User.ADMIN:
            instance.must_change_password = False
        else:
            instance.must_change_password = True
        instance.save()
        return instance

class ForcedChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(required=True, validators=[validate_password])
    def update(self, instance, validated_data):
        instance.set_password(validated_data['new_password'])
        instance.must_change_password = False
        instance.save()
        return instance

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    def validate_old_password(self, value):
        user = self.instance
        if not user.check_password(value):
            raise serializers.ValidationError("Your old password was entered incorrectly. Please enter it again.")
        return value
    def update(self, instance, validated_data):
        instance.set_password(validated_data['new_password'])
        instance.must_change_password = False
        instance.save()
        return instance

class UserDetailsValidationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(max_length=20, required=True)
    
    # --- MODIFICATION START: VALIDATE FORGOT PASSWORD FIELDS INDIVIDUALLY ---
    def validate(self, data):
        username = data.get('username')
        email = data.get('email')
        phone_number = data.get('phone_number')
        
        # Step 1: Check if the username exists and the account is active.
        try:
            user = User.objects.get(username__iexact=username, is_active=True)
        except User.DoesNotExist:
            # Raise a field-specific error for the username.
            raise serializers.ValidationError({
                "username": "No active account found with this username."
            })
            
        # Step 2: If the user exists, check if the email matches.
        if user.email.lower() != email.lower():
            raise serializers.ValidationError({
                "email": "The email address provided does not match the account's records."
            })
            
        # Step 3: If the email matches, check if the phone number matches.
        if user.phone_number != phone_number:
            raise serializers.ValidationError({
                "phone_number": "The phone number provided does not match the account's records."
            })

        data['user'] = user
        return data
    # --- MODIFICATION END ---