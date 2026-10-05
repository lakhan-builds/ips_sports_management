from rest_framework import serializers
from .models import FormSubmission, SubmissionAnswer
from apps.forms.serializers import FormSerializer
from apps.branches.serializers import BranchSerializer

class SubmissionAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubmissionAnswer
        fields = ['id', 'field', 'field_label', 'field_name', 'value', 'file_upload']

class FormSubmissionSerializer(serializers.ModelSerializer):
    answers = SubmissionAnswerSerializer(many=True, read_only=True)
    form_title = serializers.CharField(source='form.title', read_only=True)
    sport_name = serializers.CharField(source='form.sport.name', read_only=True)
    branch_code = serializers.CharField(source='branch.code', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    has_selection = serializers.SerializerMethodField()

    class Meta:
        model = FormSubmission
        fields = [
            'id', 'form', 'form_title', 'sport_name', 'student_name',
            'enrollment_number', 'branch', 'branch_code', 'branch_name',
            'semester', 'email', 'phone', 'status', 'submitted_at',
            'updated_at', 'answers', 'has_selection'
        ]
        read_only_fields = ['id', 'status', 'submitted_at', 'updated_at', 'answers', 'has_selection']

    def get_has_selection(self, obj):
        return hasattr(obj, 'selection')

class FormSubmissionCreateSerializer(serializers.Serializer):
    form_id = serializers.IntegerField(required=True)
    student_name = serializers.CharField(max_length=150, required=True)
    enrollment_number = serializers.CharField(max_length=100, required=True)
    branch_id = serializers.IntegerField(required=True)
    semester = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(max_length=20, required=True)
    answers = serializers.DictField(child=serializers.CharField(allow_blank=True), required=False, default=dict)
