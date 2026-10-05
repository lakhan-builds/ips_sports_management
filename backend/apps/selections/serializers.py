from rest_framework import serializers
from .models import StudentSelection
from apps.sports.serializers import SportSerializer
from apps.branches.serializers import BranchSerializer

class StudentSelectionSerializer(serializers.ModelSerializer):
    sport_name = serializers.CharField(source='sport.name', read_only=True)
    branch_code = serializers.CharField(source='branch.code', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    selected_by_name = serializers.CharField(source='selected_by.full_name', read_only=True, default='')

    class Meta:
        model = StudentSelection
        fields = [
            'id', 'submission', 'student_name', 'enrollment_number',
            'sport', 'sport_name', 'branch', 'branch_code', 'branch_name',
            'selected_by', 'selected_by_name', 'selected_at', 'notes', 'snapshot_data'
        ]
        read_only_fields = ['id', 'student_name', 'enrollment_number', 'sport', 'branch', 'selected_by', 'selected_by_name', 'selected_at', 'snapshot_data']

class SelectStudentInputSerializer(serializers.Serializer):
    submission_id = serializers.IntegerField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
