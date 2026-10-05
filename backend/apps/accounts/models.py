from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, username, password=None, role=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(username=username, role=role or User.Role.STUDENT_COORDINATOR, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        return self.create_user(username, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        SPORTS_COORDINATOR = 'SPORTS_COORDINATOR', 'Sports Coordinator'
        BRANCH_COORDINATOR = 'BRANCH_COORDINATOR', 'Branch Coordinator'
        STUDENT_COORDINATOR = 'STUDENT_COORDINATOR', 'Student Coordinator'

    # Role level hierarchy (lower number = higher authority)
    ROLE_HIERARCHY = {
        Role.ADMIN: 1,
        Role.SPORTS_COORDINATOR: 2,
        Role.BRANCH_COORDINATOR: 3,
        Role.STUDENT_COORDINATOR: 4,
    }

    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=True, default='')
    first_name = models.CharField(max_length=150, blank=True, default='')
    last_name = models.CharField(max_length=150, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    role = models.CharField(max_length=30, choices=Role.choices, default=Role.STUDENT_COORDINATOR)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def full_name(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.username

    def can_manage_role(self, target_role):
        """Returns True if self.role has strictly higher authority than target_role"""
        self_level = self.ROLE_HIERARCHY.get(self.role, 99)
        target_level = self.ROLE_HIERARCHY.get(target_role, 99)
        return self_level < target_level

    def can_manage_user(self, target_user):
        """Returns True if self can manage target_user"""
        if self.role == self.Role.ADMIN:
            return True
        return self.can_manage_role(target_user.role)

class CoordinatorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='coordinator_profile')
    assigned_branches = models.ManyToManyField('branches.Branch', blank=True, related_name='assigned_coordinators')
    notes = models.TextField(blank=True, default='')

    def __str__(self):
        return f"Profile: {self.user.username}"

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=100)
    object_type = models.CharField(max_length=100, blank=True, default='')
    object_id = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        username = self.user.username if self.user else 'System'
        return f"[{self.created_at:%Y-%m-%d %H:%M}] {username}: {self.action}"
