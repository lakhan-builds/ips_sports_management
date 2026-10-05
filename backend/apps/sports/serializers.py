from rest_framework import serializers
from .models import Sport

class SportSerializer(serializers.ModelSerializer):
    trials_count = serializers.SerializerMethodField()
    forms_count = serializers.SerializerMethodField()

    class Meta:
        model = Sport
        fields = ['id', 'name', 'slug', 'description', 'icon', 'is_active', 'created_at', 'updated_at', 'trials_count', 'forms_count']
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'trials_count', 'forms_count']

    def get_trials_count(self, obj):
        return obj.trials.filter(is_active=True).count()

    def get_forms_count(self, obj):
        return obj.forms.filter(is_active=True).count()
