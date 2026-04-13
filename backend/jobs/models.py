from django.db import models
from django.utils import timezone

class Job(models.Model):
    company_name = models.CharField(max_length=255)
    job_link = models.URLField(max_length=2000, blank=True)
    job_title = models.CharField(max_length=255)
    date_applied = models.DateField(null=True, blank=True)
    type_of_job = models.CharField(max_length=100, blank=True)
    salary_annual = models.CharField(max_length=50, blank=True)
    application_status = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.company_name} — {self.job_title}"