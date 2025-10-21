# Path: E:\it-admin-tool\backend\accounts\serializers.py
# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Contact
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from tickets.activity_logger import log_activity 

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.request = self.context.get("request")

    @classmethod
    def get_token(cls, user):
        try:
            full_user = User.objects.get(id=user.id)
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found during token generation.")

        token = super().get_token(full_user)
        token['user_id'] = full_user.id
        token['role'] = full_user.role
        token['must_change_password'] = full_user.must_change_password
        token['zone'] = full_user.zone
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # This is the final, correct place to log the login action.
        if hasattr(self, 'user'):
            log_activity(user=self.user, action='USER_LOGIN', request=self.request, target=self.user.username, details="User logged in successfully.")
            
        return data

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'zone')
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        if User.objects.filter(email__iexact=attrs['email']).exists():
            raise serializers.ValidationError({"email": "A user with that email already exists."})
        return attrs
    def create(self, validated_data):
        request = self.context.get("request")
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number'),
            role=validated_data.get('role', User.CLIENT),
            zone=validated_data.get('zone')
        )
        user.set_password(validated_data['password'])
        if validated_data.get('role') == User.ADMIN:
            user.must_change_password = False
        else:
            user.must_change_password = True
        user.save()
        
        if request:
             log_activity(user=request.user, request=request, action='USER_CREATED', target=user.username, details=f"New user created with role {user.role}.")
        
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'zone']
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value
    def update(self, instance, validated_data):
        request = self.context.get("request")
        updated_instance = super().update(instance, validated_data)
        if request:
            log_activity(user=request.user, request=request, action='USER_UPDATED', target=updated_instance.username, details="User details were updated.")
        return updated_instance

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'phone_number', 'role', 'is_active', 'must_change_password', 'zone')
    def get_full_name(self, obj):
        return obj.get_full_name()

class AdminPasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    def update(self, instance, validated_data):
        request = self.context.get("request")
        instance.set_password(validated_data['password'])
        if instance.role != User.ADMIN:
            instance.must_change_password = True
        instance.save()
        if request:
            log_activity(user=request.user, request=request, action='ADMIN_PASSWORD_RESET', target=instance.username, details="Password was reset by an admin.")
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
    def validate(self, data):
        username = data.get('username')
        email = data.get('email')
        phone_number = data.get('phone_number')
        try:
            user = User.objects.get(username__iexact=username, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError({"username": "No active account found with this username."})
        if user.email.lower() != email.lower():
            raise serializers.ValidationError({"email": "The email address provided does not match the account's records."})
        if user.phone_number != phone_number:
            raise serializers.ValidationError({"phone_number": "The phone number provided does not match the account's records."})
        data['user'] = user
        return data

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['id', 'circle', 'name', 'mobile_number', 'email']