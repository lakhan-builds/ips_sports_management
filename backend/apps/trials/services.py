from django.db import transaction
from django.core.exceptions import PermissionDenied
from .models import Trial
from apps.accounts.models import User
from apps.accounts.services import log_audit

def check_trial_branch_permission(user, branch):
    """Ensure user has right to create/manage trials for this branch."""
    if user.role in [User.Role.ADMIN, User.Role.SPORTS_COORDINATOR]:
        return True
    if user.role == User.Role.BRANCH_COORDINATOR:
        if not branch:
            raise PermissionDenied("Branch Coordinator must specify an assigned branch for trials.")
        assigned_branches = user.coordinator_profile.assigned_branches.values_list('id', flat=True) if hasattr(user, 'coordinator_profile') else []
        if branch.id not in assigned_branches:
            raise PermissionDenied("You can only manage trials for your assigned branch.")
        return True
    raise PermissionDenied("You do not have permission to manage trials.")

@transaction.atomic
def create_trial(user, validated_data):
    branch = validated_data.get('branch')
    check_trial_branch_permission(user, branch)

    trial = Trial.objects.create(created_by=user, **validated_data)
    log_audit(user, "TRIAL_CREATED", "Trial", trial.id, f"Created trial '{trial.title}'")
    return trial

@transaction.atomic
def update_trial(user, trial, validated_data):
    branch = validated_data.get('branch', trial.branch)
    check_trial_branch_permission(user, branch)

    for key, val in validated_data.items():
        setattr(trial, key, val)
    trial.save()
    log_audit(user, "TRIAL_UPDATED", "Trial", trial.id, f"Updated trial '{trial.title}'")
    return trial

@transaction.atomic
def publish_trial(user, trial):
    check_trial_branch_permission(user, trial.branch)
    trial.status = Trial.Status.PUBLISHED
    trial.save()
    log_audit(user, "TRIAL_PUBLISHED", "Trial", trial.id, f"Published trial '{trial.title}'")
    return trial

@transaction.atomic
def unpublish_trial(user, trial):
    check_trial_branch_permission(user, trial.branch)
    trial.status = Trial.Status.DRAFT
    trial.save()
    log_audit(user, "TRIAL_UNPUBLISHED", "Trial", trial.id, f"Unpublished trial '{trial.title}'")
    return trial

@transaction.atomic
def delete_trial(user, trial):
    check_trial_branch_permission(user, trial.branch)
    title = trial.title
    trial_id = trial.id
    trial.is_active = False
    trial.save()
    log_audit(user, "TRIAL_DELETED", "Trial", trial_id, f"Soft-deleted trial '{title}'")
    return True
