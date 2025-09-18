# COPY AND PASTE THIS ENTIRE BLOCK. THIS IS THE FINAL AND CORRECTED SERIALIZER FILE.

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['must_change_password'] = user.must_change_password
        return token

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'first_name', 'last_name', 'phone_number', 'role')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
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
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'phone_number', 'role']
    
    def validate(self, attrs):
        first_name = attrs.get('first_name', '')
        last_name = attrs.get('last_name', '')

        if any(char.isdigit() for char in first_name):
            raise serializers.ValidationError({"first_name": "First name cannot contain numbers."})

        if last_name and any(char.isdigit() for char in last_name):
            raise serializers.ValidationError({"last_name": "Last name cannot contain numbers."})
            
        return attrs

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'full_name', 'phone_number', 'role', 'is_active', 'must_change_password')
    
    def get_full_name(self, obj):
        return obj.get_full_name()

class AdminPasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    def update(self, instance, validated_data):
        instance.set_password(validated_data['password'])
        # --- THIS IS THE FIX: The logic is now identical to the create user logic ---
        if instance.role == User.ADMIN:
            instance.must_change_password = False
        else:
            instance.must_change_password = True
        instance.save()
        return instance

# --- THIS IS THE FIX: A new serializer for the forced password change page ---
class ForcedChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(required=True, validators=[validate_password])
    
    def update(self, instance, validated_data):
        instance.set_password(validated_data['new_password'])
        instance.must_change_password = False
        instance.save()
        return instance

# --- This serializer is now only for users who are already logged in and know their old password ---
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