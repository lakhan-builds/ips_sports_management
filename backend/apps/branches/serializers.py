from rest_framework import serializers
from .models import Branch

class BranchSerializer(serializers.ModelSerializer):
    coordinators_count = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = ['id', 'code', 'name', 'description', 'is_active', 'created_at', 'updated_at', 'coordinators_count']
        read_only_fields = ['id', 'created_at', 'updated_at', 'coordinators_count']

    def get_coordinators_count(self, obj):
        return obj.assigned_coordinators.count()
