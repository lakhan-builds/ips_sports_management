from rest_framework import serializers
from .models import Trial
from apps.sports.serializers import SportSerializer
from apps.branches.serializers import BranchSerializer
from apps.sports.models import Sport
from apps.branches.models import Branch

class TrialSerializer(serializers.ModelSerializer):
    sport_details = SportSerializer(source='sport', read_only=True)
    branch_details = BranchSerializer(source='branch', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default='')

    class Meta:
        model = Trial
        fields = [
            'id', 'title', 'sport', 'sport_details', 'branch', 'branch_details',
            'trial_date', 'start_time', 'end_time', 'venue', 'description',
            'poster', 'status', 'created_by', 'created_by_name', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_name', 'created_at', 'updated_at']

class TrialCreateUpdateSerializer(serializers.ModelSerializer):
    poster = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Trial
        fields = [
            'id', 'title', 'sport', 'branch', 'trial_date',
            'start_time', 'end_time', 'venue', 'description',
            'poster', 'status'
        ]
