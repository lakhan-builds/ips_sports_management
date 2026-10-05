from django.db import models

class FormSubmission(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SELECTED = 'SELECTED', 'Selected'
        NOT_SELECTED = 'NOT_SELECTED', 'Not Selected'

    form = models.ForeignKey('forms.Form', on_delete=models.PROTECT, related_name='submissions')
    student_name = models.CharField(max_length=150)
    enrollment_number = models.CharField(max_length=100)
    branch = models.ForeignKey('branches.Branch', on_delete=models.PROTECT, related_name='submissions')
    semester = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-submitted_at']
        unique_together = ('form', 'enrollment_number')

    def __str__(self):
        return f"{self.student_name} ({self.enrollment_number}) - {self.form.title} [{self.status}]"

class SubmissionAnswer(models.Model):
    submission = models.ForeignKey(FormSubmission, on_delete=models.CASCADE, related_name='answers')
    field = models.ForeignKey('forms.FormField', on_delete=models.SET_NULL, null=True, blank=True, related_name='answers')
    field_label = models.CharField(max_length=150)
    field_name = models.CharField(max_length=100)
    value = models.TextField(blank=True, default='')
    file_upload = models.FileField(upload_to='submission_files/', blank=True, null=True)

    def __str__(self):
        return f"{self.field_label}: {self.value[:30]}"
