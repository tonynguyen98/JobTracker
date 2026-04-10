from datetime import date, timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .constants import ALLOWED_STATUSES
from .models import Job
from .sanitizers import sanitize_application_status


class StatusSanitizerTests(TestCase):
    def test_allowed_statuses_are_preserved(self):
        for status in ALLOWED_STATUSES:
            self.assertEqual(sanitize_application_status(status), status)

    def test_interviewed_no_offer_is_allowed(self):
        self.assertEqual(sanitize_application_status('Interviewed - No Offer'), 'Interviewed - No Offer')


class JobEndpointTests(APITestCase):
    def setUp(self):
        self.today = date.today()
        self.yesterday = self.today - timedelta(days=1)

    def test_job_list_returns_results_and_pagination(self):
        Job.objects.create(
            company_name='Acme Corp',
            job_title='Software Engineer',
            application_status='Applied',
            date_applied=self.today,
        )
        Job.objects.create(
            company_name='Beta LLC',
            job_title='Data Scientist',
            application_status='Accepted',
            date_applied=self.today,
        )

        url = reverse('job-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 2)
        self.assertEqual(response.data['page'], 1)
        self.assertEqual(response.data['page_size'], 20)
        self.assertEqual(response.data['total_pages'], 1)
        self.assertEqual(len(response.data['results']), 2)

    def test_job_list_filters_by_status_and_search(self):
        Job.objects.create(
            company_name='Acme Corp',
            job_title='Software Engineer',
            application_status='Applied',
            date_applied=self.today,
        )
        Job.objects.create(
            company_name='Acme Innovations',
            job_title='Product Manager',
            application_status='Interview Scheduled',
            date_applied=self.today,
        )
        Job.objects.create(
            company_name='Other Co',
            job_title='Marketing Lead',
            application_status='Accepted',
            date_applied=self.today,
        )

        url = reverse('job-list')
        response = self.client.get(url, {'status': 'applied'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 1)
        self.assertEqual(response.data['results'][0]['application_status'], 'Applied')

        response = self.client.get(url, {'search': 'Acme'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 2)

        response = self.client.get(url, {'search': 'Manager'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 1)

    def test_job_list_pagination_works(self):
        for i in range(3):
            Job.objects.create(
                company_name=f'Company {i}',
                job_title='Engineer',
                application_status='Applied',
                date_applied=self.today,
            )

        url = reverse('job-list')
        response = self.client.get(url, {'page_size': 2, 'page': 2})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['page'], 2)
        self.assertEqual(response.data['page_size'], 2)
        self.assertEqual(response.data['total'], 3)
        self.assertEqual(response.data['total_pages'], 2)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_job_sanitizes_input_and_returns_created(self):
        url = reverse('job-create')
        payload = {
            'company_name': ' <b>Example Inc</b> ',
            'job_title': ' Back-end Developer ',
            'job_link': 'example.com',
            'date_applied': self.today.isoformat(),
            'salary_annual': '120k',
            'application_status': 'Interview Scheduled',
            'notes': '  Nice opportunity.  ',
        }

        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['company_name'], 'Example Inc')
        self.assertEqual(response.data['job_title'], 'Back-end Developer')
        self.assertEqual(response.data['job_link'], 'https://example.com')
        self.assertEqual(response.data['salary_annual'], '$120,000')
        self.assertEqual(response.data['application_status'], 'Interview Scheduled')
        self.assertEqual(response.data['notes'], 'Nice opportunity.')

    def test_create_job_returns_400_for_missing_required_fields(self):
        url = reverse('job-create')

        response = self.client.post(url, {'company_name': '', 'job_title': 'Engineer'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Company name is required.')

        response = self.client.post(url, {'company_name': 'Acme', 'job_title': ''}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Job title is required.')

    def test_job_detail_get_returns_single_job(self):
        job = Job.objects.create(
            company_name='Acme Corp',
            job_title='Software Engineer',
            application_status='Applied',
            date_applied=self.today,
        )

        url = reverse('job-detail', args=[job.pk])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['company_name'], 'Acme Corp')
        self.assertEqual(response.data['job_title'], 'Software Engineer')

    def test_job_detail_get_returns_404_when_missing(self):
        url = reverse('job-detail', args=[9999])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Job not found')

    def test_job_detail_patch_updates_job_and_sanitizes_fields(self):
        job = Job.objects.create(
            company_name='Acme Corp',
            job_title='Software Engineer',
            application_status='Applied',
            date_applied=self.today,
        )

        url = reverse('job-detail', args=[job.pk])
        response = self.client.patch(url, {'job_title': 'Senior Engineer', 'job_link': 'github.com'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['job_title'], 'Senior Engineer')
        self.assertEqual(response.data['job_link'], 'https://github.com')

    def test_job_detail_patch_returns_400_for_invalid_update(self):
        job = Job.objects.create(
            company_name='Acme Corp',
            job_title='Software Engineer',
            application_status='Applied',
            date_applied=self.today,
        )

        url = reverse('job-detail', args=[job.pk])
        response = self.client.patch(url, {'company_name': ''}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('company_name', response.data)

    def test_job_detail_delete_removes_job(self):
        job = Job.objects.create(
            company_name='Acme Corp',
            job_title='Software Engineer',
            application_status='Applied',
            date_applied=self.today,
        )

        url = reverse('job-detail', args=[job.pk])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Job.objects.filter(pk=job.pk).exists())

    def test_job_detail_delete_returns_404_when_missing(self):
        url = reverse('job-detail', args=[9999])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Job not found')

    def test_job_stats_returns_aggregated_counts_and_trends(self):
        Job.objects.create(
            company_name='Acme Corp',
            job_title='Engineer',
            application_status='Applied',
            date_applied=self.today,
        )
        Job.objects.create(
            company_name='Acme Corp',
            job_title='Product Manager',
            application_status='Interview Scheduled',
            date_applied=self.today,
        )
        Job.objects.create(
            company_name='Beta LLC',
            job_title='Sales Associate',
            application_status='Accepted',
            date_applied=self.today,
        )
        Job.objects.create(
            company_name='Gamma Inc',
            job_title='QA Tester',
            application_status='No Reply',
            date_applied=self.today,
        )

        url = reverse('job-stats')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 4)
        self.assertEqual(response.data['active'], 2)
        self.assertEqual(response.data['response_rate'], 50)
        self.assertEqual(response.data['by_status']['Applied'], 1)
        self.assertEqual(response.data['by_status']['Interview Scheduled'], 1)
        self.assertEqual(response.data['by_status']['Accepted'], 1)
        self.assertEqual(response.data['by_status']['No Reply'], 1)
        self.assertTrue(any(
            item['date'] == self.today.isoformat() and item['count'] == 4
            for item in response.data['applications_over_time']
        ))
        self.assertEqual(response.data['top_companies'][0]['company_name'], 'Acme Corp')
        self.assertEqual(response.data['top_companies'][0]['count'], 2)

    def test_upload_csv_returns_400_when_file_missing_or_empty(self):
        url = reverse('upload-csv')

        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'No file provided')

        empty_file = SimpleUploadedFile('jobs.csv', b'', content_type='text/csv')
        response = self.client.post(url, {'file': empty_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'CSV is empty or has no matching columns')

    def test_upload_csv_creates_new_jobs_and_updates_existing_jobs(self):
        existing_job = Job.objects.create(
            company_name='LinkedIn',
            job_title='Backend Engineer',
            date_applied=self.today,
            job_link='https://linkedin.com/jobs/1',
            salary_annual='$100,000',
            application_status='Applied',
            notes='Initial note',
        )

        content = '\n'.join([
            'Job Tracker CSV',
            'Company Name,Job Link,Job Title,Date Applied,Type of Job,Salary (Annual),Application Status,Notes',
            f'LinkedIn,linkedin.com,Backend Engineer,{self.today.isoformat()},Engineering,110k,Interview Scheduled,Updated notes',
            f'NewCo,newco.com,Product Manager,{self.yesterday.strftime("%m/%d/%Y")},Full Time,90k,Applied,New role',
        ])

        uploaded_file = SimpleUploadedFile('jobs.csv', content.encode('utf-8'), content_type='text/csv')
        url = reverse('upload-csv')
        response = self.client.post(url, {'file': uploaded_file}, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_in_csv'], 2)
        self.assertEqual(response.data['created'], 1)
        self.assertEqual(response.data['updated'], 1)
        self.assertEqual(response.data['skipped'], 0)

        existing_job.refresh_from_db()
        self.assertEqual(existing_job.salary_annual, '$110,000')
        self.assertEqual(existing_job.application_status, 'Interview Scheduled')
        self.assertEqual(existing_job.job_link, 'https://linkedin.com')

        self.assertTrue(Job.objects.filter(company_name='NewCo', job_title='Product Manager').exists())
