from django.db import models

class Trial(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'
        CANCELLED = 'CANCELLED', 'Cancelled'

    title = models.CharField(max_length=200)
    sport = models.ForeignKey('sports.Sport', on_delete=models.PROTECT, related_name='trials')
    branch = models.ForeignKey('branches.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='trials')
    trial_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    venue = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    poster = models.ImageField(upload_to='trial_posters/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PUBLISHED)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_trials')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['trial_date', 'start_time']

    def __str__(self):
        branch_str = self.branch.code if self.branch else 'All Branches'
        return f"{self.title} ({self.sport.name} - {branch_str}) on {self.trial_date}"
