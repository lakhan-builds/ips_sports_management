from django.db import models

class StudentSelection(models.Model):
    submission = models.OneToOneField('submissions.FormSubmission', on_delete=models.PROTECT, related_name='selection')
    student_name = models.CharField(max_length=150)
    enrollment_number = models.CharField(max_length=100)
    sport = models.ForeignKey('sports.Sport', on_delete=models.PROTECT, related_name='selections')
    branch = models.ForeignKey('branches.Branch', on_delete=models.PROTECT, related_name='selections')
    selected_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='selected_students')
    selected_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default='')
    snapshot_data = models.JSONField(default=dict)

    class Meta:
        ordering = ['-selected_at']

    def __str__(self):
        return f"{self.student_name} ({self.enrollment_number}) - {self.sport.name} [{self.branch.code}]"
