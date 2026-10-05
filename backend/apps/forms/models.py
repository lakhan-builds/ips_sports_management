from django.db import models

class Form(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'
        CLOSED = 'CLOSED', 'Closed'
        ARCHIVED = 'ARCHIVED', 'Archived'

    title = models.CharField(max_length=200)
    sport = models.ForeignKey('sports.Sport', on_delete=models.PROTECT, related_name='forms')
    branch = models.ForeignKey('branches.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='forms')
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    deadline = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_forms')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        branch_str = self.branch.code if self.branch else 'All Branches'
        return f"{self.title} ({self.sport.name} - {branch_str}) [{self.status}]"

    def can_accept_submissions(self):
        return self.status == self.Status.PUBLISHED and self.is_active

class FormField(models.Model):
    class FieldType(models.TextChoices):
        TEXT = 'text', 'Text'
        TEXTAREA = 'textarea', 'Textarea'
        NUMBER = 'number', 'Number'
        EMAIL = 'email', 'Email'
        PHONE = 'phone', 'Phone'
        DATE = 'date', 'Date'
        DROPDOWN = 'dropdown', 'Dropdown'
        RADIO = 'radio', 'Radio'
        CHECKBOX = 'checkbox', 'Checkbox'
        FILE = 'file', 'File/Image Upload'

    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='fields')
    label = models.CharField(max_length=150)
    field_name = models.CharField(max_length=100)
    field_type = models.CharField(max_length=30, choices=FieldType.choices, default=FieldType.TEXT)
    placeholder = models.CharField(max_length=150, blank=True, default='')
    help_text = models.CharField(max_length=255, blank=True, default='')
    is_required = models.BooleanField(default=False)
    options = models.JSONField(default=list, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.form.title} -> {self.label} ({self.field_type})"
