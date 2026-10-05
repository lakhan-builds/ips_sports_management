from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.core.exceptions import PermissionDenied

from .models import Form, FormField
from .serializers import FormSerializer, FormCreateUpdateSerializer, FormFieldSerializer
from .services import create_dynamic_form, update_dynamic_form, publish_form, close_form, reopen_form, delete_form
from apps.accounts.permissions import IsBranchCoordinatorOrAbove
from apps.accounts.models import User

class FormViewSet(viewsets.ModelViewSet):
    serializer_class = FormSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'publish', 'close', 'reopen']:
            return [permissions.IsAuthenticated(), IsBranchCoordinatorOrAbove()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user
        queryset = Form.objects.filter(is_active=True).select_related('sport', 'branch', 'created_by').prefetch_related('fields')

        # Role scoping
        if not (user.is_authenticated and user.role in [User.Role.ADMIN, User.Role.SPORTS_COORDINATOR, User.Role.BRANCH_COORDINATOR, User.Role.STUDENT_COORDINATOR]):
            # Public or unauthenticated: only published
            queryset = queryset.filter(status=Form.Status.PUBLISHED)
        elif user.role in [User.Role.BRANCH_COORDINATOR, User.Role.STUDENT_COORDINATOR]:
            assigned_branch_ids = user.coordinator_profile.assigned_branches.values_list('id', flat=True) if hasattr(user, 'coordinator_profile') else []
            queryset = queryset.filter(Q(branch__in=assigned_branch_ids) | Q(branch__isnull=True))

        # Query filters
        sport_filter = self.request.query_params.get('sport')
        if sport_filter:
            queryset = queryset.filter(Q(sport__name__iexact=sport_filter) | Q(sport_id=sport_filter))

        branch_filter = self.request.query_params.get('branch')
        if branch_filter:
            queryset = queryset.filter(branch_id=branch_filter)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(sport__name__icontains=search) |
                Q(description__icontains=search)
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = FormCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        fields_data = data.pop('fields', [])

        try:
            form = create_dynamic_form(request.user, data, fields_data)
            return Response({
                'success': True,
                'message': 'Dynamic form created successfully.',
                'data': FormSerializer(form).data
            }, status=status.HTTP_201_CREATED)
        except PermissionDenied as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_403_FORBIDDEN)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = FormCreateUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        fields_data = data.pop('fields', None)

        try:
            form = update_dynamic_form(request.user, instance, data, fields_data)
            return Response({
                'success': True,
                'message': 'Form updated successfully.',
                'data': FormSerializer(form).data
            })
        except PermissionDenied as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_403_FORBIDDEN)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            delete_form(request.user, instance)
            return Response({
                'success': True,
                'message': 'Form deleted/archived successfully.'
            }, status=status.HTTP_200_OK)
        except PermissionDenied as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        instance = self.get_object()
        try:
            form = publish_form(request.user, instance)
            return Response({
                'success': True,
                'message': 'Form published successfully.',
                'data': FormSerializer(form).data
            })
        except PermissionDenied as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        instance = self.get_object()
        try:
            form = close_form(request.user, instance)
            return Response({
                'success': True,
                'message': 'Form closed for new submissions.',
                'data': FormSerializer(form).data
            })
        except PermissionDenied as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        instance = self.get_object()
        try:
            form = reopen_form(request.user, instance)
            return Response({
                'success': True,
                'message': 'Form reopened successfully.',
                'data': FormSerializer(form).data
            })
        except PermissionDenied as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_403_FORBIDDEN)
