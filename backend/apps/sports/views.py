from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Sport
from .serializers import SportSerializer
from .services import create_sport, update_sport, delete_sport
from apps.accounts.permissions import IsAdmin

class SportViewSet(viewsets.ModelViewSet):
    serializer_class = SportSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdmin()]
        # List and retrieve: anyone authenticated or allow safe method for forms/trials
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Sport.objects.all()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
        active_filter = self.request.query_params.get('is_active')
        if active_filter is not None:
            queryset = queryset.filter(is_active=active_filter.lower() == 'true')
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sport = create_sport(request.user, serializer.validated_data)
        return Response({
            'success': True,
            'message': 'Sport created successfully.',
            'data': SportSerializer(sport).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        sport = update_sport(request.user, instance, serializer.validated_data)
        return Response({
            'success': True,
            'message': 'Sport updated successfully.',
            'data': SportSerializer(sport).data
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        delete_sport(request.user, instance)
        return Response({
            'success': True,
            'message': 'Sport deleted successfully.'
        }, status=status.HTTP_200_OK)
