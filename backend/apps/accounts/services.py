from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone
from .models import User, CoordinatorProfile, AuditLog
from apps.branches.models import Branch

def log_audit(user, action, object_type='', object_id='', description=''):
    """Utility to log auditable security and management actions."""
    return AuditLog.objects.create(
        user=user if user and user.is_authenticated else None,
        action=action,
        object_type=object_type,
        object_id=str(object_id),
        description=description
    )

@transaction.atomic
def create_coordinator(creator, validated_data, branch_ids=None):
    """
    Create a new coordinator user enforcing hierarchy rules.
    Creator must have strictly higher authority than the role being assigned.
    """
    target_role = validated_data.get('role')
    if not creator.can_manage_role(target_role):
        raise PermissionDenied(f"You do not have permission to create users with role {target_role}.")

    # If branch coordinator creates student coordinator, ensure branch is within branch coordinator's branches
    if creator.role == User.Role.BRANCH_COORDINATOR:
        if target_role != User.Role.STUDENT_COORDINATOR:
            raise PermissionDenied("Branch Coordinators can only create Student Coordinators.")
        allowed_branch_ids = list(creator.coordinator_profile.assigned_branches.values_list('id', flat=True))
        if branch_ids:
            for b_id in branch_ids:
                if b_id not in allowed_branch_ids:
                    raise PermissionDenied(f"Cannot assign user to branch {b_id} outside your assigned branches.")
        else:
            branch_ids = allowed_branch_ids

    password = validated_data.pop('password', 'Pass1234!')
    notes = validated_data.pop('notes', '')

    user = User.objects.create_user(password=password, **validated_data)
    profile, _ = CoordinatorProfile.objects.get_or_create(user=user, defaults={'notes': notes})
    if notes:
        profile.notes = notes
        profile.save()

    if branch_ids is not None:
        branches = Branch.objects.filter(id__in=branch_ids)
        profile.assigned_branches.set(branches)

    log_audit(
        user=creator,
        action="USER_CREATED",
        object_type="User",
        object_id=user.id,
        description=f"Created {user.role} user '{user.username}'"
    )
    return user

@transaction.atomic
def update_coordinator(editor, target_user, validated_data, branch_ids=None):
    """
    Update coordinator details enforcing role hierarchy.
    """
    if not editor.can_manage_user(target_user):
        raise PermissionDenied("You do not have permission to edit this user.")

    # Role escalation prevention
    new_role = validated_data.get('role')
    if new_role and new_role != target_user.role:
        if not editor.can_manage_role(new_role):
            raise PermissionDenied(f"Cannot promote or assign user to role {new_role}.")

    notes = validated_data.pop('notes', None)
    for attr, val in validated_data.items():
        setattr(target_user, attr, val)
    target_user.save()

    profile, _ = CoordinatorProfile.objects.get_or_create(user=target_user)
    if notes is not None:
        profile.notes = notes
        profile.save()

    if branch_ids is not None:
        if editor.role == User.Role.BRANCH_COORDINATOR:
            allowed_branches = set(editor.coordinator_profile.assigned_branches.values_list('id', flat=True))
            for b_id in branch_ids:
                if b_id not in allowed_branches:
                    raise PermissionDenied(f"Cannot assign branch {b_id} outside your assigned branches.")
        branches = Branch.objects.filter(id__in=branch_ids)
        profile.assigned_branches.set(branches)

    log_audit(
        user=editor,
        action="USER_UPDATED",
        object_type="User",
        object_id=target_user.id,
        description=f"Updated details for user '{target_user.username}'"
    )
    return target_user

@transaction.atomic
def delete_coordinator(deleter, target_user):
    """
    Deactivate / soft-delete coordinator to preserve historical audit & selection records.
    """
    if not deleter.can_manage_user(target_user):
        raise PermissionDenied("You do not have permission to delete this user.")

    username = target_user.username
    target_user.is_active = False
    target_user.deleted_at = timezone.now()
    target_user.save()

    log_audit(
        user=deleter,
        action="USER_DELETED",
        object_type="User",
        object_id=target_user.id,
        description=f"Soft deleted/deactivated user '{username}'"
    )
    return True

@transaction.atomic
def reset_user_password(actor, target_user, new_password):
    """
    Hierarchical password reset:
    Admin can reset anyone.
    Sports Coordinator can reset Branch and Student coordinators.
    Branch Coordinator can reset Student coordinators.
    Student Coordinator cannot reset others.
    """
    if not actor.can_manage_user(target_user) and actor.id != target_user.id:
        raise PermissionDenied("You do not have authority to reset this user's password.")

    if not new_password or len(new_password) < 6:
        raise ValidationError("Password must be at least 6 characters long.")

    target_user.set_password(new_password)
    target_user.save()

    log_audit(
        user=actor,
        action="PASSWORD_RESET",
        object_type="User",
        object_id=target_user.id,
        description=f"Reset password for user '{target_user.username}'"
    )
    return True
