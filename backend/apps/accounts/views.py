from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q
from django.core.exceptions import PermissionDenied, ValidationError

from .models import User, AuditLog
from .permissions import IsAdmin, IsSportsCoordinatorOrAbove, CanManageUser
from .serializers import (
    UserSerializer, CoordinatorCreateSerializer, CoordinatorUpdateSerializer,
    PasswordResetSerializer, ChangePasswordSerializer, AuditLogSerializer,
    CustomTokenObtainPairSerializer
)
from .services import (
    create_coordinator, update_coordinator, delete_coordinator,
    reset_user_password, log_audit
)

class CustomLoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

class MeView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'success': False, 'message': 'Incorrect current password.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        log_audit(user, "PASSWORD_CHANGED", "User", user.id, "User changed own password.")
        return Response({'success': True, 'message': 'Password changed successfully.'})

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CanManageUser]
    serializer_class = UserSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.filter(is_active=True).select_related('coordinator_profile').prefetch_related('coordinator_profile__assigned_branches')

        # Role scoping
        if user.role == User.Role.ADMIN:
            pass  # Admin sees all users
        elif user.role == User.Role.SPORTS_COORDINATOR:
            queryset = queryset.filter(role__in=[User.Role.BRANCH_COORDINATOR, User.Role.STUDENT_COORDINATOR])
        elif user.role == User.Role.BRANCH_COORDINATOR:
            assigned_branch_ids = user.coordinator_profile.assigned_branches.values_list('id', flat=True) if hasattr(user, 'coordinator_profile') else []
            queryset = queryset.filter(
                role=User.Role.STUDENT_COORDINATOR,
                coordinator_profile__assigned_branches__in=assigned_branch_ids
            ).distinct()
        else:
            queryset = queryset.none()

        # Query filters
        role_filter = self.request.query_params.get('role')
        if role_filter:
            queryset = queryset.filter(role=role_filter)

        branch_filter = self.request.query_params.get('branch')
        if branch_filter:
            queryset = queryset.filter(coordinator_profile__assigned_branches__id=branch_filter)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = CoordinatorCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        branch_ids = data.pop('branch_ids', None)

        try:
            created_user = create_coordinator(request.user, data, branch_ids=branch_ids)
            output_serializer = UserSerializer(created_user)
            return Response({
                'success': True,
                'message': f'{created_user.get_role_display()} created successfully.',
                'data': output_serializer.data
            }, status=status.HTTP_201_CREATED)
        except (PermissionDenied, ValidationError) as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = CoordinatorUpdateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        branch_ids = data.pop('branch_ids', None)

        try:
            updated_user = update_coordinator(request.user, instance, data, branch_ids=branch_ids)
            output_serializer = UserSerializer(updated_user)
            return Response({
                'success': True,
                'message': 'User updated successfully.',
                'data': output_serializer.data
            })
        except (PermissionDenied, ValidationError) as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            delete_coordinator(request.user, instance)
            return Response({
                'success': True,
                'message': 'User deleted successfully.'
            }, status=status.HTTP_200_OK)
        except PermissionDenied as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        instance = self.get_object()
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_password = serializer.validated_data['new_password']

        try:
            reset_user_password(request.user, instance, new_password)
            return Response({
                'success': True,
                'message': f"Password for '{instance.username}' has been reset successfully."
            })
        except (PermissionDenied, ValidationError) as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsSportsCoordinatorOrAbove]
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        queryset = AuditLog.objects.select_related('user').all()
        user_filter = self.request.query_params.get('user')
        if user_filter:
            queryset = queryset.filter(user_id=user_filter)
        action_filter = self.request.query_params.get('action')
        if action_filter:
            queryset = queryset.filter(action=action_filter)
        return queryset
