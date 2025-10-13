# COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

from rest_framework import generics, permissions, status, views, viewsets, filters
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.pagination import PageNumberPagination
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

# --- THIS IS THE FIX ---
class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardResultsSetPagination  # Add pagination
    filter_backends = [filters.SearchFilter]        # Add search
    search_fields = ['username', 'first_name', 'last_name', 'email', 'phone_number', 'role']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer
    def get_queryset(self):
        is_active_param = self.request.query_params.get('is_active', 'true')
        is_active = is_active_param.lower() == 'true'
        return User.objects.filter(is_active=is_active).order_by('username')
# --- END OF FIX ---

class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
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
        instance.is_active = False
        instance.save()

class RestoreUserView(views.APIView):
    permission_classes = [IsAdminRole]
    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.is_active = True
            user.save()
            return Response({"detail": "User restored successfully."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

class AdminPasswordResetView(generics.UpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAdminRole]
    serializer_class = AdminPasswordResetSerializer
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
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
    queryset = Contact.objects.order_by('name')
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

class ContactExportView(generics.ListAPIView):
    queryset = Contact.objects.order_by('name')
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]