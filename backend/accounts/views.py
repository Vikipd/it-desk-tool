# D:\it-admin-tool\backend\accounts\views.py

# =================================================================
# IMPORTS
# =================================================================

# Import the base view for handling token creation (login)
from rest_framework_simplejwt.views import TokenObtainPairView

# Import the custom serializer WE created in serializers.py
from .serializers import MyTokenObtainPairSerializer

# Imports for your other views
from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .serializers import UserSerializer
from .models import User


# =================================================================
# TOKEN VIEW (LOGIN)
# =================================================================

# THIS IS THE CLASS THAT WAS MISSING
# This view will handle the login request at the /api/token/ endpoint.
class MyTokenObtainPairView(TokenObtainPairView):
    """
    Takes a set of user credentials and returns an access and refresh JSON web
    token pair. This view is customized to use our MyTokenObtainPairSerializer
    which adds the user's 'role' to the token payload.
    """
    serializer_class = MyTokenObtainPairSerializer


# =================================================================
# OTHER USER-RELATED VIEWS (These are fine, no changes needed)
# =================================================================

class UserDetailView(generics.RetrieveAPIView):
    """
    A view to retrieve the details of the currently authenticated user.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListCreateView(generics.ListCreateAPIView):
    """
    A view for admins to list all users or create a new user.
    Protected to be accessed only by admin users.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    
class TechnicianListView(generics.ListAPIView):
    """
    A view for admins to get a list of all users with the 'TECHNICIAN' role.
    """
    queryset = User.objects.filter(role=User.TECHNICIAN)
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]