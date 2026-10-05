import csv
from io import StringIO
from django.db import transaction
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from .models import StudentSelection
from apps.submissions.models import FormSubmission
from apps.accounts.models import User
from apps.accounts.services import log_audit

def check_selection_branch_permission(user, branch):
    if user.role in [User.Role.ADMIN, User.Role.SPORTS_COORDINATOR]:
        return True
    if user.role in [User.Role.BRANCH_COORDINATOR, User.Role.STUDENT_COORDINATOR]:
        assigned_branches = user.coordinator_profile.assigned_branches.values_list('id', flat=True) if hasattr(user, 'coordinator_profile') else []
        if branch.id not in assigned_branches:
            raise PermissionDenied("You can only select students from your assigned branch.")
        return True
    raise PermissionDenied("You do not have permission to select students.")

@transaction.atomic
def select_student(user, submission_id, notes=''):
    try:
        submission = FormSubmission.objects.select_related('form', 'form__sport', 'branch').prefetch_related('answers').get(id=submission_id)
    except FormSubmission.DoesNotExist:
        raise ValidationError("Submission record not found.")

    check_selection_branch_permission(user, submission.branch)

    # Compile comprehensive snapshot of submitted data
    snapshot = {
        'submission_id': submission.id,
        'form_title': submission.form.title,
        'sport_id': submission.form.sport.id,
        'sport_name': submission.form.sport.name,
        'branch_code': submission.branch.code,
        'branch_name': submission.branch.name,
        'student_name': submission.student_name,
        'enrollment_number': submission.enrollment_number,
        'semester': submission.semester,
        'email': submission.email,
        'phone': submission.phone,
        'submitted_at': submission.submitted_at.isoformat() if submission.submitted_at else '',
        'answers': [
            {
                'field_name': ans.field_name,
                'field_label': ans.field_label,
                'value': ans.value,
                'file_url': ans.file_upload.url if ans.file_upload else None
            }
            for ans in submission.answers.all()
        ]
    }

    selection, created = StudentSelection.objects.update_or_create(
        submission=submission,
        defaults={
            'student_name': submission.student_name,
            'enrollment_number': submission.enrollment_number,
            'sport': submission.form.sport,
            'branch': submission.branch,
            'selected_by': user,
            'notes': notes,
            'snapshot_data': snapshot,
        }
    )

    submission.status = FormSubmission.Status.SELECTED
    submission.save()

    log_audit(
        user=user,
        action="STUDENT_SELECTED",
        object_type="StudentSelection",
        object_id=selection.id,
        description=f"Selected student '{submission.student_name}' ({submission.enrollment_number}) for {submission.form.sport.name}"
    )

    return selection

@transaction.atomic
def mark_not_selected(user, submission_id, notes=''):
    try:
        submission = FormSubmission.objects.select_related('branch', 'form__sport').get(id=submission_id)
    except FormSubmission.DoesNotExist:
        raise ValidationError("Submission record not found.")

    check_selection_branch_permission(user, submission.branch)

    # If previously selected, remove the selection record or update notes
    StudentSelection.objects.filter(submission=submission).delete()
    submission.status = FormSubmission.Status.NOT_SELECTED
    submission.save()

    log_audit(
        user=user,
        action="STUDENT_REJECTED",
        object_type="FormSubmission",
        object_id=submission.id,
        description=f"Marked student '{submission.student_name}' as Not Selected for {submission.form.sport.name}"
    )

    return submission

def export_selections_csv(queryset):
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'ID', 'Student Name', 'Enrollment Number', 'Sport',
        'Branch Code', 'Branch Name', 'Selected By', 'Selected At', 'Notes'
    ])

    for sel in queryset:
        writer.writerow([
            sel.id,
            sel.student_name,
            sel.enrollment_number,
            sel.sport.name,
            sel.branch.code,
            sel.branch.name,
            sel.selected_by.full_name if sel.selected_by else 'N/A',
            sel.selected_at.strftime('%Y-%m-%d %H:%M:%S') if sel.selected_at else '',
            sel.notes
        ])

    return output.getvalue()
