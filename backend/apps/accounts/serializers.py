from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, CoordinatorProfile, AuditLog
from apps.branches.models import Branch

class BranchSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'code', 'name']

class CoordinatorProfileSerializer(serializers.ModelSerializer):
    assigned_branches = BranchSimpleSerializer(many=True, read_only=True)
    assigned_branch_ids = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='assigned_branches'
    )

    class Meta:
        model = CoordinatorProfile
        fields = ['id', 'notes', 'assigned_branches', 'assigned_branch_ids']

class UserSerializer(serializers.ModelSerializer):
    coordinator_profile = CoordinatorProfileSerializer(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    assigned_branches = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'phone', 'role', 'role_display', 'is_active',
            'created_at', 'updated_at', 'coordinator_profile', 'assigned_branches'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'role_display']

    def get_assigned_branches(self, obj):
        if hasattr(obj, 'coordinator_profile') and obj.coordinator_profile:
            return BranchSimpleSerializer(obj.coordinator_profile.assigned_branches.all(), many=True).data
        return []

class CoordinatorCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, required=False, default='Pass1234!')
    branch_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'role', 'password', 'branch_ids', 'notes'
        ]

class CoordinatorUpdateSerializer(serializers.ModelSerializer):
    branch_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    notes = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'phone', 'role', 'branch_ids', 'notes', 'is_active'
        ]

class PasswordResetSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=6, required=True)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(min_length=6, required=True)

class AuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True, default='System')
    user_role = serializers.CharField(source='user.role', read_only=True, default='')

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_username', 'user_role', 'action', 'object_type', 'object_id', 'description', 'created_at']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['full_name'] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user_serializer = UserSerializer(self.user)
        data['user'] = user_serializer.data
        return data
