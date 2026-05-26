from django.urls import path

from controllers.jobs import job_list, job_create, job_stats, upload_csv, job_detail

urlpatterns = [
    path('jobs/', job_list, name='job-list'),
    path('jobs/create/', job_create, name='job-create'),
    path('jobs/stats/', job_stats, name='job-stats'),
    path('jobs/upload-csv/', upload_csv, name='upload-csv'),
    path('jobs/<int:pk>/', job_detail, name='job-detail'),
]
