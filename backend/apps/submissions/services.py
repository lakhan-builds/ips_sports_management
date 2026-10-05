import csv
from io import StringIO
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import FormSubmission, SubmissionAnswer
from apps.forms.models import Form
from apps.branches.models import Branch

@transaction.atomic
def submit_form(form_id, student_info, answers_dict=None, files_dict=None, ip_address=None):
    try:
        form = Form.objects.select_related('sport', 'branch').get(id=form_id)
    except Form.DoesNotExist:
        raise ValidationError("Target form does not exist.")

    if not form.can_accept_submissions():
        raise ValidationError(f"This form is currently {form.status.lower()} and not accepting submissions.")

    enrollment = student_info.get('enrollment_number', '').strip()
    if FormSubmission.objects.filter(form=form, enrollment_number__iexact=enrollment).exists():
        raise ValidationError(f"A submission for enrollment '{enrollment}' has already been registered for this form.")

    try:
        branch = Branch.objects.get(id=student_info.get('branch_id'))
    except Branch.DoesNotExist:
        raise ValidationError("Selected branch is invalid.")

    # Validate required dynamic fields
    fields = form.fields.filter(is_active=True)
    answers_dict = answers_dict or {}
    files_dict = files_dict or {}

    for f in fields:
        val = answers_dict.get(f.field_name, '')
        file_val = files_dict.get(f.field_name)
        if f.is_required and not val and not file_val:
            raise ValidationError(f"Field '{f.label}' is required.")

    submission = FormSubmission.objects.create(
        form=form,
        student_name=student_info.get('student_name'),
        enrollment_number=enrollment,
        branch=branch,
        semester=student_info.get('semester', ''),
        email=student_info.get('email'),
        phone=student_info.get('phone'),
        ip_address=ip_address
    )

    for f in fields:
        val = answers_dict.get(f.field_name, '')
        file_val = files_dict.get(f.field_name)
        SubmissionAnswer.objects.create(
            submission=submission,
            field=f,
            field_label=f.label,
            field_name=f.field_name,
            value=str(val) if val is not None else '',
            file_upload=file_val
        )

    return submission

def export_submissions_csv(queryset):
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'ID', 'Form Title', 'Sport', 'Student Name', 'Enrollment Number',
        'Branch Code', 'Branch Name', 'Semester', 'Email', 'Phone', 'Status', 'Submitted At'
    ])

    for sub in queryset:
        writer.writerow([
            sub.id,
            sub.form.title,
            sub.form.sport.name,
            sub.student_name,
            sub.enrollment_number,
            sub.branch.code,
            sub.branch.name,
            sub.semester,
            sub.email,
            sub.phone,
            sub.status,
            sub.submitted_at.strftime('%Y-%m-%d %H:%M:%S') if sub.submitted_at else ''
        ])

    return output.getvalue()
