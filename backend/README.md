# Backend

Django REST Framework API for the JobTracker application. Follows an MVC layout with the Django app shell (`jobs/`) kept minimal.

## Stack

- Python 3.12+
- Django
- Django REST Framework
- PostgreSQL
- python-dotenv for environment configuration

## Project structure

```
backend/
├── config/           # Django project settings and root URL config
├── jobs/             # Django app shell
│   ├── migrations/   # Database migrations (tied to the 'jobs' app label)
│   ├── admin.py
│   ├── apps.py
│   └── models.py     # One-line re-export of Job for Django model discovery
├── models/           # M: data layer
│   └── job.py        # Job model (app_label = 'jobs')
├── controllers/      # C: request handling
│   └── jobs.py       # All API endpoints
├── serializers/      # V: data presentation
│   └── jobs.py       # DRF serializer for Job
├── utils/            # Shared helpers
│   └── __init__.py   # CSV parsing + input sanitization
├── constants.py      # ALLOWED_STATUSES and DEFAULT_STATUS
├── urls.py           # URL routing for the API
├── tests.py          # Test suite
└── manage.py
```

The `jobs/` directory is intentionally thin — it exists only to satisfy Django's app system. All business logic lives in the MVC directories at the `backend/` root.

## Getting started

### Prerequisites

- Python 3.12+
- PostgreSQL 16+

### Install dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install django djangorestframework django-cors-headers psycopg2-binary python-dotenv
```

### Create local environment file

Create `backend/.env` with the following values:

```text
DEBUG=True
DB_NAME=jobtracker_db
DB_USER=jobtracker_user
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

### Setup PostgreSQL

```bash
psql postgres
```

```sql
CREATE DATABASE jobtracker_db;
CREATE USER jobtracker_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE jobtracker_db TO jobtracker_user;
\q
```

### Run migrations and start

```bash
python manage.py migrate
python manage.py runserver
```

The backend will be available at `http://localhost:8000` and the API root is `http://localhost:8000/api/`.

### Run tests

```bash
python manage.py test tests --settings=config.test_settings
```

## API endpoints

| Method | URL                     | Description                                                                 |
| ------ | ----------------------- | --------------------------------------------------------------------------- |
| GET    | `/api/jobs/`            | List jobs with optional `status`, `search`, `page`, and `page_size` filters |
| POST   | `/api/jobs/create/`     | Create a new job                                                            |
| GET    | `/api/jobs/<id>/`       | Retrieve a job by ID                                                        |
| PATCH  | `/api/jobs/<id>/`       | Update a job by ID                                                          |
| DELETE | `/api/jobs/<id>/`       | Delete a job by ID                                                          |
| GET    | `/api/jobs/stats/`      | Return aggregated counts, response rate, and time-series data               |
| POST   | `/api/jobs/upload-csv/` | Import jobs from CSV and upsert matching rows                               |

## CSV import

The upload endpoint accepts a file upload under the `file` form field. It reads the CSV, creates new jobs, updates existing jobs that match on `(company_name, job_title, date_applied)`, and reports counts for created/updated/skipped rows.

## Notes

- `config/settings.py` loads environment variables from `backend/.env` using `python-dotenv`.
- Input sanitization lives in `utils/__init__.py` — called by both the create/update endpoints and the CSV upload.
- Job create/update requests validate required fields (`company_name`, `job_title`) and return 400 responses for invalid input.
- The `Job` model declares `app_label = 'jobs'` so Django's migration system stays consistent even though the model file lives outside the `jobs/` app directory.
