from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Q
from django.core.exceptions import PermissionDenied, ValidationError

from .models import StudentSelection
from .serializers import StudentSelectionSerializer, SelectStudentInputSerializer
from .services import select_student, mark_not_selected, export_selections_csv
from apps.accounts.models import User

class StudentSelectionViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSelectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = StudentSelection.objects.select_related('sport', 'branch', 'selected_by', 'submission')

        # Role scoping
        if user.role in [User.Role.ADMIN, User.Role.SPORTS_COORDINATOR]:
            pass
        elif user.role in [User.Role.BRANCH_COORDINATOR, User.Role.STUDENT_COORDINATOR]:
            assigned_branch_ids = user.coordinator_profile.assigned_branches.values_list('id', flat=True) if hasattr(user, 'coordinator_profile') else []
            queryset = queryset.filter(branch__in=assigned_branch_ids)

        sport_filter = self.request.query_params.get('sport')
        if sport_filter:
            queryset = queryset.filter(Q(sport__name__iexact=sport_filter) | Q(sport_id=sport_filter))

        branch_filter = self.request.query_params.get('branch')
        if branch_filter:
            queryset = queryset.filter(branch_id=branch_filter)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(student_name__icontains=search) |
                Q(enrollment_number__icontains=search)
            )

        return queryset

    @action(detail=False, methods=['post'])
    def select(self, request):
        serializer = SelectStudentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sub_id = serializer.validated_data['submission_id']
        notes = serializer.validated_data.get('notes', '')

        try:
            selection = select_student(request.user, sub_id, notes=notes)
            return Response({
                'success': True,
                'message': f"Student '{selection.student_name}' marked as Selected.",
                'data': StudentSelectionSerializer(selection).data
            }, status=status.HTTP_201_CREATED)
        except (PermissionDenied, ValidationError) as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='unselect')
    def unselect(self, request):
        serializer = SelectStudentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sub_id = serializer.validated_data['submission_id']
        notes = serializer.validated_data.get('notes', '')

        try:
            sub = mark_not_selected(request.user, sub_id, notes=notes)
            return Response({
                'success': True,
                'message': f"Student '{sub.student_name}' marked as Not Selected."
            })
        except (PermissionDenied, ValidationError) as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        csv_data = export_selections_csv(queryset)
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="selected_students.csv"'
        return response
