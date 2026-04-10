# Backend

This backend is a Django application using Django REST Framework for the JobTracker API.

## Stack

- Python 3.12+
- Django
- Django REST Framework
- PostgreSQL
- python-dotenv for environment configuration

## Project structure

```
backend/
├── config/          # Django project settings and URL routing
├── data/            # Optional local CSV sources and fixtures
├── jobs/            # Jobs app — models, serializers, views, utilities
│   ├── models.py
│   ├── serializers.py
│   ├── urls.py
│   ├── views.py
│   └── utils.py
├── manage.py
└── .env             # Local environment variables (not committed)
```

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

## API endpoints

| Method | URL                     | Description                                                                 |
| ------ | ----------------------- | --------------------------------------------------------------------------- |
| GET    | `/api/jobs/`            | List jobs with optional `status`, `search`, `page`, and `page_size` filters |
| POST   | `/api/jobs/create/`     | Create a new job                                                            |
| GET    | `/api/jobs/<id>/`       | Retrieve a job by ID                                                        |
| PATCH  | `/api/jobs/<id>/`       | Update a job by ID                                                          |
| DELETE | `/api/jobs/<id>/`       | Delete a job by ID                                                          |
| GET    | `/api/jobs/stats/`      | Return total jobs and counts by status                                      |
| POST   | `/api/jobs/upload-csv/` | Import jobs from CSV and upsert matching rows                               |

## CSV import

The upload endpoint accepts a file upload under the `file` form field. It reads the CSV, creates new jobs, updates existing jobs that match on company, title, and applied date, and reports counts for created/updated/skipped rows.

## Notes

- `config/settings.py` loads environment variables from `backend/.env` using `python-dotenv`.
- The `jobs` app sanitizes user input and CSV upload data through `jobs/sanitizers.py`.
- Job create/update requests validate required fields such as `company_name` and `job_title` and return clear 400 responses for invalid input.
- CSV uploads normalize and validate fields like URLs, salary values, and application status, while skipping empty or malformed rows.
- The backend API is used by the frontend through `NEXT_PUBLIC_API_URL=http://localhost:8000/api`.
