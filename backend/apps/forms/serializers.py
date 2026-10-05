from rest_framework import serializers
from .models import Form, FormField
from apps.sports.serializers import SportSerializer
from apps.branches.serializers import BranchSerializer

class FormFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormField
        fields = [
            'id', 'label', 'field_name', 'field_type', 'placeholder',
            'help_text', 'is_required', 'options', 'order', 'is_active'
        ]

class FormSerializer(serializers.ModelSerializer):
    fields = FormFieldSerializer(many=True, read_only=True)
    sport_details = SportSerializer(source='sport', read_only=True)
    branch_details = BranchSerializer(source='branch', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default='')
    submissions_count = serializers.SerializerMethodField()

    class Meta:
        model = Form
        fields = [
            'id', 'title', 'sport', 'sport_details', 'branch', 'branch_details',
            'description', 'status', 'deadline', 'created_by', 'created_by_name',
            'is_active', 'created_at', 'updated_at', 'fields', 'submissions_count'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_name', 'created_at', 'updated_at', 'submissions_count']

    def get_submissions_count(self, obj):
        return obj.submissions.count()

class FormFieldInputSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    label = serializers.CharField(max_length=150)
    field_name = serializers.CharField(max_length=100)
    field_type = serializers.ChoiceField(choices=FormField.FieldType.choices)
    placeholder = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    help_text = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    is_required = serializers.BooleanField(required=False, default=False)
    options = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    order = serializers.IntegerField(required=False, default=0)

class FormCreateUpdateSerializer(serializers.ModelSerializer):
    fields = FormFieldInputSerializer(many=True, required=False)

    class Meta:
        model = Form
        fields = [
            'id', 'title', 'sport', 'branch', 'description', 'status', 'deadline', 'fields'
        ]
