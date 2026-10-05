from django.db import transaction
from .models import Branch
from apps.accounts.services import log_audit

@transaction.atomic
def create_branch(user, validated_data):
    branch = Branch.objects.create(**validated_data)
    log_audit(user, "BRANCH_CREATED", "Branch", branch.id, f"Created branch '{branch.code}'")
    return branch

@transaction.atomic
def update_branch(user, branch, validated_data):
    for key, val in validated_data.items():
        setattr(branch, key, val)
    branch.save()
    log_audit(user, "BRANCH_UPDATED", "Branch", branch.id, f"Updated branch '{branch.code}'")
    return branch

@transaction.atomic
def delete_branch(user, branch):
    code = branch.code
    branch_id = branch.id
    branch.delete()
    log_audit(user, "BRANCH_DELETED", "Branch", branch_id, f"Deleted branch '{code}'")
    return True
