from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Q
from django.core.exceptions import ValidationError

from .models import FormSubmission
from .serializers import FormSubmissionSerializer, FormSubmissionCreateSerializer
from .services import submit_form, export_submissions_csv
from apps.accounts.models import User

class FormSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = FormSubmissionSerializer

    def get_permissions(self):
        # Anyone (including unregistered students) can submit a form
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = FormSubmission.objects.select_related('form', 'form__sport', 'branch').prefetch_related('answers')

        if not user.is_authenticated:
            return queryset.none()

        # Role scoping
        if user.role in [User.Role.ADMIN, User.Role.SPORTS_COORDINATOR]:
            pass  # Full access
        elif user.role in [User.Role.BRANCH_COORDINATOR, User.Role.STUDENT_COORDINATOR]:
            assigned_branch_ids = user.coordinator_profile.assigned_branches.values_list('id', flat=True) if hasattr(user, 'coordinator_profile') else []
            queryset = queryset.filter(branch__in=assigned_branch_ids)

        # Filters
        form_filter = self.request.query_params.get('form')
        if form_filter:
            queryset = queryset.filter(form_id=form_filter)

        sport_filter = self.request.query_params.get('sport')
        if sport_filter:
            queryset = queryset.filter(Q(form__sport__name__iexact=sport_filter) | Q(form__sport_id=sport_filter))

        branch_filter = self.request.query_params.get('branch')
        if branch_filter:
            queryset = queryset.filter(branch_id=branch_filter)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(student_name__icontains=search) |
                Q(enrollment_number__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = FormSubmissionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        form_id = data.get('form_id')
        answers = data.get('answers', {})
        files = request.FILES

        student_info = {
            'student_name': data.get('student_name'),
            'enrollment_number': data.get('enrollment_number'),
            'branch_id': data.get('branch_id'),
            'semester': data.get('semester', ''),
            'email': data.get('email'),
            'phone': data.get('phone'),
        }

        ip = request.META.get('REMOTE_ADDR')

        try:
            submission = submit_form(form_id, student_info, answers, files, ip_address=ip)
            return Response({
                'success': True,
                'message': 'Registration submitted successfully!',
                'data': FormSubmissionSerializer(submission).data
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'success': False, 'message': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        csv_data = export_submissions_csv(queryset)
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="form_submissions.csv"'
        return response
