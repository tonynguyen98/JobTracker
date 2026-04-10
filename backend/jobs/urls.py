from django.urls import path
from . import views

urlpatterns = [
    path('jobs/', views.job_list, name='job-list'),
    path('jobs/create/', views.job_create, name='job-create'),
    path('jobs/stats/', views.job_stats, name='job-stats'),
    path('jobs/upload-csv/', views.upload_csv, name='upload-csv'),
    path('jobs/<int:pk>/', views.job_detail, name='job-detail'),
]