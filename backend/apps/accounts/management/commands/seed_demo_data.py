from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, time, timedelta

from apps.accounts.models import User, CoordinatorProfile, AuditLog
from apps.branches.models import Branch
from apps.sports.models import Sport
from apps.trials.models import Trial
from apps.forms.models import Form, FormField
from apps.submissions.models import FormSubmission, SubmissionAnswer
from apps.selections.models import StudentSelection
from apps.selections.services import select_student

class Command(BaseCommand):
    help = 'Seeds realistic demo data with hierarchical coordinators, branches, sports, trials, forms, and selections.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding Sports Management System demo data..."))

        # 1. Branches
        branches_data = [
            ('CSE', 'Computer Science & Engineering', 'Department of Computer Science'),
            ('ECE', 'Electronics & Communication', 'Department of Electronics'),
            ('ME', 'Mechanical Engineering', 'Department of Mechanical Engineering'),
            ('Civil', 'Civil Engineering', 'Department of Civil Engineering'),
            ('MBA', 'Master of Business Administration', 'School of Management'),
            ('BBA', 'Bachelor of Business Administration', 'School of Business'),
        ]
        branches = {}
        for code, name, desc in branches_data:
            b, _ = Branch.objects.get_or_create(code=code, defaults={'name': name, 'description': desc})
            branches[code] = b
        self.stdout.write(self.style.SUCCESS(f"Branches verified: {len(branches)}"))

        # 2. Sports
        sports_data = [
            ('Football', 'Outdoor pitch, 11v11 university tournament', 'trophy'),
            ('Cricket', 'Main cricket oval, standard T20 / One-day tournament', 'target'),
            ('Basketball', 'Indoor wooden court, inter-branch tournament', 'activity'),
            ('Badminton', 'Indoor synthetic court 4 courts', 'zap'),
            ('Volleyball', 'Outdoor sand & clay court', 'award'),
            ('Athletics', '400m synthetic running track & field events', 'flame'),
            ('Table Tennis', 'Indoor club, 6 tables', 'circle'),
            ('Chess', 'Activity hall, FIDE rapid rules', 'shield'),
            ('Kabaddi', 'Outdoor pro-kabaddi synthetic mat', 'users'),
        ]
        sports = {}
        for s_name, desc, icon in sports_data:
            s, _ = Sport.objects.get_or_create(name=s_name, defaults={'description': desc, 'icon': icon})
            sports[s_name] = s
        self.stdout.write(self.style.SUCCESS(f"Sports verified: {len(sports)}"))

        # 3. Users Hierarchy
        # Admin
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@institution.edu',
                'first_name': 'Chief',
                'last_name': 'Admin',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()
        CoordinatorProfile.objects.get_or_create(user=admin_user, defaults={'notes': 'Institutional System Administrator'})

        # Sports Coordinator
        sports_user, _ = User.objects.get_or_create(
            username='sports1',
            defaults={
                'email': 'sports.director@institution.edu',
                'first_name': 'Vikram',
                'last_name': 'Rathore',
                'phone': '+91 9876543210',
                'role': User.Role.SPORTS_COORDINATOR,
                'is_staff': False,
            }
        )
        sports_user.set_password('sports123')
        sports_user.save()
        sports_prof, _ = CoordinatorProfile.objects.get_or_create(user=sports_user, defaults={'notes': 'University Sports Director'})
        sports_prof.assigned_branches.set(branches.values())

        # Branch Coordinator (e.g. assigned to CSE & ECE)
        branch_user, _ = User.objects.get_or_create(
            username='branch1',
            defaults={
                'email': 'branch.coord@institution.edu',
                'first_name': 'Priya',
                'last_name': 'Nair',
                'phone': '+91 9876543222',
                'role': User.Role.BRANCH_COORDINATOR,
                'is_staff': False,
            }
        )
        branch_user.set_password('branch123')
        branch_user.save()
        branch_prof, _ = CoordinatorProfile.objects.get_or_create(user=branch_user, defaults={'notes': 'CSE & ECE Branch Sports Head'})
        branch_prof.assigned_branches.set([branches['CSE'], branches['ECE']])

        # Student Coordinator (assigned to CSE)
        student_user, _ = User.objects.get_or_create(
            username='student1',
            defaults={
                'email': 'student.coord@institution.edu',
                'first_name': 'Aman',
                'last_name': 'Verma',
                'phone': '+91 9876543333',
                'role': User.Role.STUDENT_COORDINATOR,
                'is_staff': False,
            }
        )
        student_user.set_password('student123')
        student_user.save()
        student_prof, _ = CoordinatorProfile.objects.get_or_create(user=student_user, defaults={'notes': 'CSE Student Sports Council Representative'})
        student_prof.assigned_branches.set([branches['CSE']])

        self.stdout.write(self.style.SUCCESS("Demo users created: admin/admin123, sports1/sports123, branch1/branch123, student1/student123"))

        # 4. Trials
        trials_info = [
            {
                'title': 'Annual University Football Trials 2026',
                'sport': sports['Football'],
                'branch': branches['CSE'],
                'trial_date': date.today() + timedelta(days=5),
                'start_time': time(9, 0),
                'end_time': time(13, 0),
                'venue': 'University Main Football Arena',
                'description': 'Open trials for university varsity football squad. Bring standard studs and shin guards.',
                'status': Trial.Status.PUBLISHED,
                'created_by': sports_user
            },
            {
                'title': 'Inter-Branch Cricket Squad Selection',
                'sport': sports['Cricket'],
                'branch': branches['CSE'],
                'trial_date': date.today() + timedelta(days=7),
                'start_time': time(8, 30),
                'end_time': time(14, 0),
                'venue': 'Campus Cricket Pavilion',
                'description': 'Batting, fast bowling, and spin auditions for the Chancellor Cup.',
                'status': Trial.Status.PUBLISHED,
                'created_by': branch_user
            },
            {
                'title': 'Varsity Basketball Selection Camp',
                'sport': sports['Basketball'],
                'branch': branches['ECE'],
                'trial_date': date.today() + timedelta(days=9),
                'start_time': time(16, 0),
                'end_time': time(19, 0),
                'venue': 'Indoor Sports Complex, Court 1',
                'description': 'Speed drills, scrimmage, shooting accuracy assessment.',
                'status': Trial.Status.PUBLISHED,
                'created_by': sports_user
            },
            {
                'title': 'Inter-Collegiate Badminton Trials',
                'sport': sports['Badminton'],
                'branch': None, # Open to all branches
                'trial_date': date.today() + timedelta(days=12),
                'start_time': time(10, 0),
                'end_time': time(15, 0),
                'venue': 'Indoor Stadium Badminton Hall',
                'description': 'Singles and Doubles ranking trials for state universities tournament.',
                'status': Trial.Status.PUBLISHED,
                'created_by': sports_user
            },
        ]
        created_trials = []
        for t in trials_info:
            trial_obj, _ = Trial.objects.get_or_create(title=t['title'], defaults=t)
            created_trials.append(trial_obj)
        self.stdout.write(self.style.SUCCESS(f"Trials seeded: {len(created_trials)}"))

        # 5. Dynamic Forms
        # Form 1: Football Registration Form
        fb_form, _ = Form.objects.get_or_create(
            title='Football Trial Registration 2026',
            defaults={
                'sport': sports['Football'],
                'branch': branches['CSE'],
                'description': 'Official player registration form for university football team trials.',
                'status': Form.Status.PUBLISHED,
                'deadline': timezone.now() + timedelta(days=10),
                'created_by': branch_user
            }
        )

        football_fields = [
            ('Preferred Playing Position', 'position', FormField.FieldType.DROPDOWN, 'Select position', True, ['Goalkeeper', 'Center Back', 'Full Back', 'Midfielder', 'Winger', 'Striker'], 0),
            ('Jersey Number Preference', 'jersey_number', FormField.FieldType.NUMBER, '1 - 99', False, [], 1),
            ('Past Playing Experience', 'experience', FormField.FieldType.TEXTAREA, 'State, District, School, or Club level achievements', True, [], 2),
            ('Dominant Foot', 'dominant_foot', FormField.FieldType.RADIO, '', True, ['Right', 'Left', 'Both'], 3),
            ('Height in cm', 'height', FormField.FieldType.NUMBER, 'e.g. 175', False, [], 4),
            ('Weight in kg', 'weight', FormField.FieldType.NUMBER, 'e.g. 68', False, [], 5),
            ('Medical Clearance Declaration', 'medical_declaration', FormField.FieldType.CHECKBOX, '', True, ['I declare that I am physically fit for competitive trials.'], 6),
        ]
        for label, fname, ftype, placeholder, req, opts, order in football_fields:
            FormField.objects.get_or_create(
                form=fb_form,
                field_name=fname,
                defaults={
                    'label': label,
                    'field_type': ftype,
                    'placeholder': placeholder,
                    'is_required': req,
                    'options': opts,
                    'order': order
                }
            )

        # Form 2: Cricket Registration Form
        cricket_form, _ = Form.objects.get_or_create(
            title='Cricket Trial Audition Form',
            defaults={
                'sport': sports['Cricket'],
                'branch': branches['CSE'],
                'description': 'Registration for batsmen, bowlers, wicketkeepers, and all-rounders.',
                'status': Form.Status.PUBLISHED,
                'deadline': timezone.now() + timedelta(days=14),
                'created_by': branch_user
            }
        )
        cricket_fields = [
            ('Primary Role', 'cricket_role', FormField.FieldType.DROPDOWN, 'Choose your role', True, ['Top-order Batsman', 'Middle-order Batsman', 'Fast Bowler', 'Spin Bowler', 'Wicketkeeper Batsman', 'All-rounder'], 0),
            ('Batting Style', 'batting_style', FormField.FieldType.RADIO, '', True, ['Right-handed', 'Left-handed'], 1),
            ('Bowling Style', 'bowling_style', FormField.FieldType.DROPDOWN, 'Bowling style if applicable', False, ['Right-arm Fast', 'Left-arm Fast', 'Off-spin', 'Leg-spin', 'None'], 2),
            ('Past Tournaments', 'tournaments', FormField.FieldType.TEXTAREA, 'Specify club, district, or inter-school tournaments', False, [], 3),
        ]
        for label, fname, ftype, placeholder, req, opts, order in cricket_fields:
            FormField.objects.get_or_create(
                form=cricket_form,
                field_name=fname,
                defaults={
                    'label': label,
                    'field_type': ftype,
                    'placeholder': placeholder,
                    'is_required': req,
                    'options': opts,
                    'order': order
                }
            )

        # Form 3: Basketball Registration Form
        basketball_form, _ = Form.objects.get_or_create(
            title='Basketball Team Auditions 2026',
            defaults={
                'sport': sports['Basketball'],
                'branch': branches['ECE'],
                'description': 'Inter-branch basketball varsity squad selection.',
                'status': Form.Status.PUBLISHED,
                'deadline': timezone.now() + timedelta(days=12),
                'created_by': branch_user
            }
        )
        bb_fields = [
            ('Playing Position', 'bb_position', FormField.FieldType.DROPDOWN, 'Select position', True, ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'], 0),
            ('Height in cm', 'height', FormField.FieldType.NUMBER, 'e.g. 188', True, [], 1),
            ('Previous Competition Level', 'comp_level', FormField.FieldType.TEXT, 'e.g. School National, District', False, [], 2),
        ]
        for label, fname, ftype, placeholder, req, opts, order in bb_fields:
            FormField.objects.get_or_create(
                form=basketball_form,
                field_name=fname,
                defaults={
                    'label': label,
                    'field_type': ftype,
                    'placeholder': placeholder,
                    'is_required': req,
                    'options': opts,
                    'order': order
                }
            )

        self.stdout.write(self.style.SUCCESS("Dynamic forms and fields created."))

        # 6. Sample Submissions
        sample_students = [
            {
                'form': fb_form,
                'name': 'Rahul Sharma',
                'enrollment': '20260123',
                'branch': branches['CSE'],
                'semester': '3',
                'email': 'rahul.sharma@institution.edu',
                'phone': '+91 9811223344',
                'answers': {
                    'position': 'Striker',
                    'jersey_number': '10',
                    'experience': 'Played state sub-junior championship 2024, scored 12 goals.',
                    'dominant_foot': 'Right',
                    'height': '178',
                    'weight': '71',
                    'medical_declaration': 'I declare that I am physically fit for competitive trials.'
                }
            },
            {
                'form': fb_form,
                'name': 'Amit Kumar',
                'enrollment': '20260124',
                'branch': branches['CSE'],
                'semester': '5',
                'email': 'amit.kumar@institution.edu',
                'phone': '+91 9811223355',
                'answers': {
                    'position': 'Midfielder',
                    'jersey_number': '8',
                    'experience': 'Captain of regional school team, district winner 2025.',
                    'dominant_foot': 'Both',
                    'height': '174',
                    'weight': '67',
                    'medical_declaration': 'I declare that I am physically fit for competitive trials.'
                }
            },
            {
                'form': fb_form,
                'name': 'Rohan Patel',
                'enrollment': '20260125',
                'branch': branches['CSE'],
                'semester': '3',
                'email': 'rohan.patel@institution.edu',
                'phone': '+91 9811223366',
                'answers': {
                    'position': 'Center Back',
                    'jersey_number': '4',
                    'experience': 'Inter-branch football tournament 2025 defender.',
                    'dominant_foot': 'Right',
                    'height': '182',
                    'weight': '75',
                    'medical_declaration': 'I declare that I am physically fit for competitive trials.'
                }
            },
            {
                'form': cricket_form,
                'name': 'Devansh Gupta',
                'enrollment': '20260201',
                'branch': branches['CSE'],
                'semester': '1',
                'email': 'devansh.gupta@institution.edu',
                'phone': '+91 9822334455',
                'answers': {
                    'cricket_role': 'Fast Bowler',
                    'batting_style': 'Right-handed',
                    'bowling_style': 'Right-arm Fast',
                    'tournaments': 'U-19 District league, taken 18 wickets in 6 matches.'
                }
            },
            {
                'form': cricket_form,
                'name': 'Siddharth Roy',
                'enrollment': '20260202',
                'branch': branches['CSE'],
                'semester': '3',
                'email': 'siddharth.roy@institution.edu',
                'phone': '+91 9822334466',
                'answers': {
                    'cricket_role': 'Top-order Batsman',
                    'batting_style': 'Left-handed',
                    'bowling_style': 'None',
                    'tournaments': 'State academy opener, highest score 114*.'
                }
            },
            {
                'form': basketball_form,
                'name': 'Tanvi Deshmukh',
                'enrollment': '20260301',
                'branch': branches['ECE'],
                'semester': '3',
                'email': 'tanvi.deshmukh@institution.edu',
                'phone': '+91 9833445566',
                'answers': {
                    'bb_position': 'Shooting Guard',
                    'height': '176',
                    'comp_level': 'State Basketball Championship 2024 (Silver medalist)'
                }
            },
        ]

        created_submissions = []
        for s in sample_students:
            sub, created = FormSubmission.objects.get_or_create(
                form=s['form'],
                enrollment_number=s['enrollment'],
                defaults={
                    'student_name': s['name'],
                    'branch': s['branch'],
                    'semester': s['semester'],
                    'email': s['email'],
                    'phone': s['phone'],
                    'status': FormSubmission.Status.PENDING
                }
            )
            # Create answers
            for fname, val in s['answers'].items():
                field_obj = s['form'].fields.filter(field_name=fname).first()
                if field_obj:
                    SubmissionAnswer.objects.get_or_create(
                        submission=sub,
                        field=field_obj,
                        defaults={
                            'field_label': field_obj.label,
                            'field_name': field_obj.field_name,
                            'value': str(val)
                        }
                    )
            created_submissions.append(sub)

        self.stdout.write(self.style.SUCCESS(f"Sample submissions created: {len(created_submissions)}"))

        # 7. Perform sample Student Selection using the select_student service (preserves snapshot_data!)
        rahul_sub = FormSubmission.objects.filter(enrollment_number='20260123').first()
        if rahul_sub:
            select_student(student_user, rahul_sub.id, notes='Superb ball control, designated university starting forward.')
            self.stdout.write(self.style.SUCCESS("Selected student: Rahul Sharma (20260123) with full snapshot preserved."))

        amit_sub = FormSubmission.objects.filter(enrollment_number='20260124').first()
        if amit_sub:
            select_student(branch_user, amit_sub.id, notes='Excellent stamina and playmaking vision in midfield.')
            self.stdout.write(self.style.SUCCESS("Selected student: Amit Kumar (20260124) with full snapshot preserved."))

        self.stdout.write(self.style.SUCCESS("\nDemo data seeding completed successfully!"))
        self.stdout.write(self.style.NOTICE("Login accounts:"))
        self.stdout.write(self.style.NOTICE("  Admin: admin / admin123"))
        self.stdout.write(self.style.NOTICE("  Sports Coordinator: sports1 / sports123"))
        self.stdout.write(self.style.NOTICE("  Branch Coordinator: branch1 / branch123"))
        self.stdout.write(self.style.NOTICE("  Student Coordinator: student1 / student123"))
