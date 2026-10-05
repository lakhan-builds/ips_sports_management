from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.core.exceptions import PermissionDenied

from .models import Trial
from .serializers import TrialSerializer, TrialCreateUpdateSerializer
from .services import create_trial, update_trial, publish_trial, unpublish_trial, delete_trial
from apps.accounts.permissions import IsBranchCoordinatorOrAbove
from apps.accounts.models import User

class TrialViewSet(viewsets.ModelViewSet):
    serializer_class = TrialSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'publish', 'unpublish']:
            return [permissions.IsAuthenticated(), IsBranchCoordinatorOrAbove()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user
        queryset = Trial.objects.filter(is_active=True).select_related('sport', 'branch', 'created_by')

        # If user is not coordinator or admin, only show PUBLISHED trials
        if not (user.is_authenticated and user.role in [User.Role.ADMIN, User.Role.SPORTS_COORDINATOR, User.Role.BRANCH_COORDINATOR, User.Role.STUDENT_COORDINATOR]):
            queryset = queryset.filter(status=Trial.Status.PUBLISHED)
        elif user.role == User.Role.BRANCH_COORDINATOR:
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
                Q(venue__icontains=search) |
                Q(description__icontains=search)
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = TrialCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            trial = create_trial(request.user, serializer.validated_data)
            return Response({
                'success': True,
                'message': 'Trial created successfully.',
                'data': TrialSerializer(trial).data
            }, status=status.HTTP_201_CREATED)
        except PermissionDenied as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_403_FORBIDDEN)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = TrialCreateUpdateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        try:
            trial = update_trial(request.user, instance, serializer.validated_data)
            return Response({
                'success': True,
                'message': 'Trial updated successfully.',
                'data': TrialSerializer(trial).data
            })
        except PermissionDenied as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_403_FORBIDDEN)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            delete_trial(request.user, instance)
            return Response({
                'success': True,
                'message': 'Trial deleted successfully.'
            }, status=status.HTTP_200_OK)
        except PermissionDenied as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        instance = self.get_object()
        try:
            trial = publish_trial(request.user, instance)
            return Response({
                'success': True,
                'message': 'Trial published successfully.',
                'data': TrialSerializer(trial).data
            })
        except PermissionDenied as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        instance = self.get_object()
        try:
            trial = unpublish_trial(request.user, instance)
            return Response({
                'success': True,
                'message': 'Trial unpublished.',
                'data': TrialSerializer(trial).data
            })
        except PermissionDenied as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_403_FORBIDDEN)
