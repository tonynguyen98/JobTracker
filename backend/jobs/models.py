from django.db import models

class Job(models.Model):
    company_name = models.CharField(max_length=255)
    job_link = models.URLField(blank=True)
    job_title = models.CharField(max_length=255)
    date_applied = models.DateField(null=True, blank=True)
    type_of_job = models.CharField(max_length=100, blank=True)
    salary_annual = models.CharField(max_length=50, blank=True)
    application_status = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company_name} — {self.job_title}"