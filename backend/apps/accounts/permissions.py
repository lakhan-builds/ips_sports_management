from rest_framework import permissions
from .models import User

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN)

class IsSportsCoordinator(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.SPORTS_COORDINATOR)

class IsBranchCoordinator(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.BRANCH_COORDINATOR)

class IsStudentCoordinator(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.STUDENT_COORDINATOR)

class IsSportsCoordinatorOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in [User.Role.ADMIN, User.Role.SPORTS_COORDINATOR]

class IsBranchCoordinatorOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in [User.Role.ADMIN, User.Role.SPORTS_COORDINATOR, User.Role.BRANCH_COORDINATOR]

class IsStudentCoordinatorOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

class CanManageUser(permissions.BasePermission):
    """
    Checks hierarchical authority:
    Admin can manage anyone.
    Sports Coordinator can manage Branch and Student coordinators.
    Branch Coordinator can manage Student coordinators.
    Student Coordinator cannot manage coordinators.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == User.Role.STUDENT_COORDINATOR:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.id == obj.id:
            # Users can view their own details, but cannot delete or change their own role hierarchy
            if request.method in permissions.SAFE_METHODS:
                return True
        return request.user.can_manage_user(obj)
