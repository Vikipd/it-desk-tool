# Path: E:\it-admin-tool\backend\accounts\views.py
# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from rest_framework import generics, permissions, status, views, viewsets, filters
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from tickets.activity_logger import log_activity
from .models import User, Contact
from .serializers import (
    MyTokenObtainPairSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    AdminPasswordResetSerializer,
    ForcedChangePasswordSerializer,
    ChangePasswordSerializer,
    UserDetailsValidationSerializer,
    ContactSerializer
)
from .permissions import IsAdminOrReadOnly, IsAdminRole

class LogoutView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        log_activity(user=request.user, request=request, action='USER_LOGOUT', target=request.user.username, details="User logged out successfully.")
        
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_204_NO_CONTENT)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class UserDetailsValidationView(views.APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserDetailsValidationSerializer
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            return Response({"success": "User details validated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def get_serializer(self, *args, **kwargs):
        return self.serializer_class(*args, **kwargs)

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ForcedChangePasswordSerializer
    model = User
    permission_classes = (permissions.IsAuthenticated,)
    def get_object(self, queryset=None):
        return self.request.user
    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.update(self.object, serializer.validated_data)
            return Response({"detail": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role']
    search_fields = ['username', 'first_name', 'last_name', 'email', 'phone_number', 'zone']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer
    def get_queryset(self):
        is_active_param = self.request.query_params.get('is_active', 'true')
        is_active = is_active_param.lower() == 'true'
        return User.objects.filter(is_active=is_active).order_by('username')

    def list(self, request, *args, **kwargs):
        if request.query_params.get('export') == 'true':
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        
        return super().list(request, *args, **kwargs)

# --- THIS IS THE FIX ---
# Corrected the class name from RetrieveUpdateDestroyView to RetrieveUpdateDestroyAPIView
class UserRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def perform_destroy(self, instance):
        if instance == self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You cannot deactivate your own account.")
        log_activity(user=self.request.user, request=self.request, action='USER_DEACTIVATED', target=instance.username, details="User account was deactivated.")
        instance.is_active = False
        instance.save()

class RestoreUserView(views.APIView):
    permission_classes = [IsAdminRole]
    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.is_active = True
            user.save()
            log_activity(user=request.user, request=request, action='USER_RESTORED', target=user.username, details="User account was restored.")
            return Response({"detail": "User restored successfully."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

class AdminPasswordResetView(generics.UpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAdminRole]
    serializer_class = AdminPasswordResetSerializer
    def post(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)
        
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_activity(user=request.user, request=self.request, action='ADMIN_PASSWORD_RESET', target=user.username, details="Password was reset by an admin.")
        return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)

class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return self.request.user

class TechnicianListView(generics.ListAPIView):
    queryset = User.objects.filter(role=User.TECHNICIAN, is_active=True).order_by('first_name')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class ContactListView(generics.ListAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]

class ContactExportView(generics.ListAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]