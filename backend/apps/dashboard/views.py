from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q

from apps.accounts.models import User, CoordinatorProfile
from apps.branches.models import Branch
from apps.sports.models import Sport
from apps.trials.models import Trial
from apps.forms.models import Form
from apps.submissions.models import FormSubmission
from apps.selections.models import StudentSelection
from apps.accounts.serializers import UserSerializer
from apps.trials.serializers import TrialSerializer
from apps.forms.serializers import FormSerializer
from apps.selections.serializers import StudentSelectionSerializer

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role

        assigned_branches = []
        assigned_branch_ids = []
        if hasattr(user, 'coordinator_profile') and user.coordinator_profile:
            assigned_branches = user.coordinator_profile.assigned_branches.all()
            assigned_branch_ids = list(assigned_branches.values_list('id', flat=True))

        data = {
            'role': role,
            'user': {
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'role': role,
                'role_display': user.get_role_display(),
            },
            'stats': {},
            'recent_trials': [],
            'recent_forms': [],
            'recent_selections': [],
            'sports_summary': [],
            'branch_summary': []
        }

        # Base querysets
        branches_qs = Branch.objects.filter(is_active=True)
        sports_qs = Sport.objects.filter(is_active=True)
        trials_qs = Trial.objects.filter(is_active=True)
        forms_qs = Form.objects.filter(is_active=True)
        submissions_qs = FormSubmission.objects.all()
        selections_qs = StudentSelection.objects.all()

        if role == User.Role.ADMIN:
            data['stats'] = {
                'total_sports': sports_qs.count(),
                'total_branches': branches_qs.count(),
                'total_coordinators': User.objects.filter(is_active=True).exclude(role=User.Role.ADMIN).count(),
                'total_trials': trials_qs.count(),
                'active_trials': trials_qs.filter(status=Trial.Status.PUBLISHED).count(),
                'total_forms': forms_qs.count(),
                'active_forms': forms_qs.filter(status=Form.Status.PUBLISHED).count(),
                'total_submissions': submissions_qs.count(),
                'total_selected_students': selections_qs.count(),
            }
            data['recent_trials'] = TrialSerializer(trials_qs.order_by('-created_at')[:5], many=True).data
            data['recent_forms'] = FormSerializer(forms_qs.order_by('-created_at')[:5], many=True).data
            data['recent_selections'] = StudentSelectionSerializer(selections_qs.order_by('-selected_at')[:5], many=True).data

        elif role == User.Role.SPORTS_COORDINATOR:
            data['stats'] = {
                'total_branches': branches_qs.count(),
                'active_trials': trials_qs.filter(status=Trial.Status.PUBLISHED).count(),
                'active_forms': forms_qs.filter(status=Form.Status.PUBLISHED).count(),
                'total_submissions': submissions_qs.count(),
                'total_selected_students': selections_qs.count(),
                'branch_coordinators': User.objects.filter(role=User.Role.BRANCH_COORDINATOR, is_active=True).count(),
                'student_coordinators': User.objects.filter(role=User.Role.STUDENT_COORDINATOR, is_active=True).count(),
            }
            data['recent_trials'] = TrialSerializer(trials_qs.order_by('-created_at')[:5], many=True).data
            data['recent_forms'] = FormSerializer(forms_qs.order_by('-created_at')[:5], many=True).data
            data['recent_selections'] = StudentSelectionSerializer(selections_qs.order_by('-selected_at')[:5], many=True).data

        elif role == User.Role.BRANCH_COORDINATOR:
            branch_trials = trials_qs.filter(Q(branch__in=assigned_branch_ids) | Q(branch__isnull=True))
            branch_forms = forms_qs.filter(Q(branch__in=assigned_branch_ids) | Q(branch__isnull=True))
            branch_submissions = submissions_qs.filter(branch__in=assigned_branch_ids)
            branch_selections = selections_qs.filter(branch__in=assigned_branch_ids)

            data['stats'] = {
                'assigned_branches_count': len(assigned_branch_ids),
                'active_trials': branch_trials.filter(status=Trial.Status.PUBLISHED).count(),
                'active_forms': branch_forms.filter(status=Form.Status.PUBLISHED).count(),
                'total_submissions': branch_submissions.count(),
                'total_selected_students': branch_selections.count(),
                'student_coordinators': User.objects.filter(
                    role=User.Role.STUDENT_COORDINATOR,
                    is_active=True,
                    coordinator_profile__assigned_branches__in=assigned_branch_ids
                ).distinct().count(),
            }
            data['recent_trials'] = TrialSerializer(branch_trials.order_by('-created_at')[:5], many=True).data
            data['recent_forms'] = FormSerializer(branch_forms.order_by('-created_at')[:5], many=True).data
            data['recent_selections'] = StudentSelectionSerializer(branch_selections.order_by('-selected_at')[:5], many=True).data

        elif role == User.Role.STUDENT_COORDINATOR:
            coord_forms = forms_qs.filter(Q(branch__in=assigned_branch_ids) | Q(branch__isnull=True), status=Form.Status.PUBLISHED)
            coord_submissions = submissions_qs.filter(branch__in=assigned_branch_ids)
            coord_selections = selections_qs.filter(branch__in=assigned_branch_ids)

            data['stats'] = {
                'available_sports': sports_qs.count(),
                'active_forms': coord_forms.count(),
                'total_submissions': coord_submissions.count(),
                'total_selected_students': coord_selections.count(),
            }
            data['recent_forms'] = FormSerializer(coord_forms.order_by('-created_at')[:6], many=True).data
            data['recent_selections'] = StudentSelectionSerializer(coord_selections.order_by('-selected_at')[:5], many=True).data

        # Sports summary with submission & selection breakdown for charts/reports
        sports_breakdown = []
        for sport in sports_qs:
            subs = submissions_qs.filter(form__sport=sport)
            sels = selections_qs.filter(sport=sport)
            if role in [User.Role.BRANCH_COORDINATOR, User.Role.STUDENT_COORDINATOR]:
                subs = subs.filter(branch__in=assigned_branch_ids)
                sels = sels.filter(branch__in=assigned_branch_ids)
            sports_breakdown.append({
                'sport_id': sport.id,
                'sport_name': sport.name,
                'submissions_count': subs.count(),
                'selections_count': sels.count(),
            })
        data['sports_summary'] = sports_breakdown

        return Response({'success': True, 'data': data})
