from django.db import transaction
from django.core.exceptions import PermissionDenied, ValidationError
from .models import Form, FormField
from apps.accounts.models import User
from apps.accounts.services import log_audit

def check_form_permission(user, branch):
    if user.role in [User.Role.ADMIN, User.Role.SPORTS_COORDINATOR]:
        return True
    if user.role == User.Role.BRANCH_COORDINATOR:
        if not branch:
            raise PermissionDenied("Branch Coordinator must associate the form with an assigned branch.")
        assigned_branches = user.coordinator_profile.assigned_branches.values_list('id', flat=True) if hasattr(user, 'coordinator_profile') else []
        if branch.id not in assigned_branches:
            raise PermissionDenied("You can only manage forms for your assigned branch.")
        return True
    raise PermissionDenied("You do not have permission to manage forms.")

@transaction.atomic
def create_dynamic_form(user, form_data, fields_data=None):
    branch = form_data.get('branch')
    check_form_permission(user, branch)

    form = Form.objects.create(created_by=user, **form_data)

    if fields_data:
        for idx, f_data in enumerate(fields_data):
            f_data.pop('id', None)
            FormField.objects.create(
                form=form,
                order=f_data.get('order', idx),
                **f_data
            )

    log_audit(user, "FORM_CREATED", "Form", form.id, f"Created dynamic form '{form.title}'")
    return form

@transaction.atomic
def update_dynamic_form(user, form, form_data, fields_data=None):
    branch = form_data.get('branch', form.branch)
    check_form_permission(user, branch)

    for key, val in form_data.items():
        setattr(form, key, val)
    form.save()

    if fields_data is not None:
        # Re-sync fields
        existing_ids = []
        for idx, f_data in enumerate(fields_data):
            field_id = f_data.pop('id', None)
            order = f_data.pop('order', idx)
            if field_id:
                FormField.objects.filter(id=field_id, form=form).update(order=order, **f_data)
                existing_ids.append(field_id)
            else:
                new_field = FormField.objects.create(form=form, order=order, **f_data)
                existing_ids.append(new_field.id)
        # Remove fields that were omitted
        form.fields.exclude(id__in=existing_ids).delete()

    log_audit(user, "FORM_UPDATED", "Form", form.id, f"Updated dynamic form '{form.title}'")
    return form

@transaction.atomic
def publish_form(user, form):
    check_form_permission(user, form.branch)
    form.status = Form.Status.PUBLISHED
    form.save()
    log_audit(user, "FORM_PUBLISHED", "Form", form.id, f"Published form '{form.title}'")
    return form

@transaction.atomic
def close_form(user, form):
    check_form_permission(user, form.branch)
    form.status = Form.Status.CLOSED
    form.save()
    log_audit(user, "FORM_CLOSED", "Form", form.id, f"Closed form '{form.title}'")
    return form

@transaction.atomic
def reopen_form(user, form):
    check_form_permission(user, form.branch)
    form.status = Form.Status.PUBLISHED
    form.save()
    log_audit(user, "FORM_REOPENED", "Form", form.id, f"Reopened form '{form.title}'")
    return form

@transaction.atomic
def delete_form(user, form):
    check_form_permission(user, form.branch)
    title = form.title
    form_id = form.id
    # Soft delete to preserve historical submission references
    form.is_active = False
    form.status = Form.Status.ARCHIVED
    form.save()
    log_audit(user, "FORM_DELETED", "Form", form_id, f"Archived/Soft-deleted form '{title}'")
    return True
