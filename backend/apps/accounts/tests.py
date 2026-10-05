from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User, CoordinatorProfile
from apps.branches.models import Branch
from apps.sports.models import Sport
from apps.forms.models import Form, FormField
from apps.submissions.models import FormSubmission, SubmissionAnswer
from apps.selections.models import StudentSelection
from apps.selections.services import select_student
from apps.accounts.services import reset_user_password, create_coordinator

class AccountsAndHierarchyTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create branches
        self.branch_cse = Branch.objects.create(code='CSE', name='Computer Science')
        self.branch_ece = Branch.objects.create(code='ECE', name='Electronics')

        # Create Users
        self.admin = User.objects.create_superuser(username='admin', password='adminpassword')
        
        self.sports_coord = User.objects.create_user(
            username='sports_user', password='sportspassword', role=User.Role.SPORTS_COORDINATOR
        )
        p_sports = CoordinatorProfile.objects.create(user=self.sports_coord)
        p_sports.assigned_branches.set([self.branch_cse, self.branch_ece])

        self.branch_coord = User.objects.create_user(
            username='branch_user', password='branchpassword', role=User.Role.BRANCH_COORDINATOR
        )
        p_branch = CoordinatorProfile.objects.create(user=self.branch_coord)
        p_branch.assigned_branches.set([self.branch_cse])

        self.student_coord = User.objects.create_user(
            username='student_user', password='studentpassword', role=User.Role.STUDENT_COORDINATOR
        )
        p_student = CoordinatorProfile.objects.create(user=self.student_coord)
        p_student.assigned_branches.set([self.branch_cse])

    def test_login_success(self):
        response = self.client.post('/api/v1/auth/login/', {'username': 'admin', 'password': 'adminpassword'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['user']['role'], 'ADMIN')

    def test_login_invalid(self):
        response = self.client.post('/api/v1/auth/login/', {'username': 'admin', 'password': 'wrongpassword'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_higher_level_can_reset_lower_level_password(self):
        # Admin can reset sports coordinator
        result = reset_user_password(self.admin, self.sports_coord, 'new_sports_pass123')
        self.assertTrue(result)
        self.assertTrue(self.sports_coord.check_password('new_sports_pass123'))

        # Sports coordinator can reset branch coordinator
        result2 = reset_user_password(self.sports_coord, self.branch_coord, 'new_branch_pass123')
        self.assertTrue(result2)
        self.assertTrue(self.branch_coord.check_password('new_branch_pass123'))

        # Branch coordinator can reset student coordinator
        result3 = reset_user_password(self.branch_coord, self.student_coord, 'new_student_pass123')
        self.assertTrue(result3)
        self.assertTrue(self.student_coord.check_password('new_student_pass123'))

    def test_lower_level_cannot_reset_higher_level_password(self):
        from django.core.exceptions import PermissionDenied
        # Student coordinator cannot reset branch coordinator
        with self.assertRaises(PermissionDenied):
            reset_user_password(self.student_coord, self.branch_coord, 'hacked_pass123')

        # Branch coordinator cannot reset sports coordinator
        with self.assertRaises(PermissionDenied):
            reset_user_password(self.branch_coord, self.sports_coord, 'hacked_pass123')

        # Sports coordinator cannot reset admin
        with self.assertRaises(PermissionDenied):
            reset_user_password(self.sports_coord, self.admin, 'hacked_pass123')

    def test_branch_coordinator_can_only_create_student_coordinator(self):
        from django.core.exceptions import PermissionDenied
        # Attempt to create Sports Coordinator by Branch Coordinator -> must fail
        with self.assertRaises(PermissionDenied):
            create_coordinator(
                self.branch_coord,
                {'username': 'bad_user', 'role': User.Role.SPORTS_COORDINATOR, 'password': 'Pass1234!'}
            )

    def test_branch_coordinator_can_create_student_coordinator_under_assigned_branch(self):
        new_sc = create_coordinator(
            self.branch_coord,
            {'username': 'new_sc', 'role': User.Role.STUDENT_COORDINATOR, 'password': 'Pass1234!'},
            branch_ids=[self.branch_cse.id]
        )
        self.assertEqual(new_sc.role, User.Role.STUDENT_COORDINATOR)
        self.assertIn(self.branch_cse, new_sc.coordinator_profile.assigned_branches.all())


class FormAndSelectionWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.branch = Branch.objects.create(code='CSE', name='Computer Science')
        self.sport = Sport.objects.create(name='Football')
        
        self.coord = User.objects.create_user(
            username='student_coord1', password='pass', role=User.Role.STUDENT_COORDINATOR
        )
        prof = CoordinatorProfile.objects.create(user=self.coord)
        prof.assigned_branches.set([self.branch])

        # Form
        self.form = Form.objects.create(
            title='Football Trials',
            sport=self.sport,
            branch=self.branch,
            status=Form.Status.PUBLISHED
        )
        self.field = FormField.objects.create(
            form=self.form,
            label='Playing Position',
            field_name='position',
            field_type=FormField.FieldType.TEXT,
            is_required=True
        )

    def test_form_submission_and_snapshot_selection(self):
        # 1. Public user submits form
        sub_resp = self.client.post('/api/v1/submissions/', {
            'form_id': self.form.id,
            'student_name': 'Karan Singh',
            'enrollment_number': '20269999',
            'branch_id': self.branch.id,
            'email': 'karan@institution.edu',
            'phone': '9988776655',
            'answers': {'position': 'Goalkeeper'}
        }, format='json')
        self.assertEqual(sub_resp.status_code, status.HTTP_201_CREATED)
        submission_id = sub_resp.data['data']['id']

        # 2. Coordinator logs in and selects student
        self.client.force_authenticate(user=self.coord)
        select_resp = self.client.post('/api/v1/selections/select/', {
            'submission_id': submission_id,
            'notes': 'Great reflex saves during trial'
        }, format='json')
        self.assertEqual(select_resp.status_code, status.HTTP_201_CREATED)

        # 3. Verify selection record & snapshot integrity
        selection = StudentSelection.objects.get(submission_id=submission_id)
        self.assertEqual(selection.student_name, 'Karan Singh')
        self.assertIn('snapshot_data', select_resp.data['data'])
        snapshot = selection.snapshot_data
        self.assertEqual(snapshot['student_name'], 'Karan Singh')
        self.assertEqual(snapshot['enrollment_number'], '20269999')
        self.assertEqual(snapshot['sport_name'], 'Football')
        self.assertEqual(snapshot['branch_code'], 'CSE')
        self.assertEqual(snapshot['answers'][0]['field_name'], 'position')
        self.assertEqual(snapshot['answers'][0]['value'], 'Goalkeeper')

        # 4. Verify original submission status updated
        sub = FormSubmission.objects.get(id=submission_id)
        self.assertEqual(sub.status, FormSubmission.Status.SELECTED)
