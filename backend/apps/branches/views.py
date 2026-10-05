from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Branch
from .serializers import BranchSerializer
from .services import create_branch, update_branch, delete_branch
from apps.accounts.permissions import IsAdmin
from apps.accounts.models import User

class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdmin()]
        # List and retrieve: anyone authenticated or allow safe method for forms/trials
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Branch.objects.all()
        user = self.request.user

        # If user is branch coordinator and specifically requesting assigned only
        assigned_only = self.request.query_params.get('assigned_only') == 'true'
        if assigned_only and user.is_authenticated and user.role in [User.Role.BRANCH_COORDINATOR, User.Role.STUDENT_COORDINATOR]:
            if hasattr(user, 'coordinator_profile'):
                queryset = user.coordinator_profile.assigned_branches.all()

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(code__icontains=search) | Q(name__icontains=search))

        active_filter = self.request.query_params.get('is_active')
        if active_filter is not None:
            queryset = queryset.filter(is_active=active_filter.lower() == 'true')

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        branch = create_branch(request.user, serializer.validated_data)
        return Response({
            'success': True,
            'message': 'Branch created successfully.',
            'data': BranchSerializer(branch).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        branch = update_branch(request.user, instance, serializer.validated_data)
        return Response({
            'success': True,
            'message': 'Branch updated successfully.',
            'data': BranchSerializer(branch).data
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        delete_branch(request.user, instance)
        return Response({
            'success': True,
            'message': 'Branch deleted successfully.'
        }, status=status.HTTP_200_OK)
