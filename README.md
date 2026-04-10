# JobTracker

A full-stack job application tracker built with Next.js, Django, and PostgreSQL.

## Stack

- **Frontend** — Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend** — Django, Django REST Framework
- **Database** — PostgreSQL

## Project structure

```
JobTracker/
├── backend/
│   ├── config/          # Django project settings and URL config
│   ├── data/            # Optional CSV source for imports
│   ├── jobs/            # Jobs app — models, serializers, views, utils
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── utils.py
│   ├── manage.py
│   └── .env             # Local environment variables (not committed)
└── frontend/
    ├── app/
    │   └── page.tsx     # Main job table and dashboard UI
    ├── components/
    │   ├── CsvUploadButton.tsx
    │   ├── JobModal.tsx
    │   ├── JobTable.tsx
    │   └── StatCards.tsx
    ├── lib/
    │   ├── api.ts        # API helpers for backend endpoints
    │   └── constants.ts  # Shared status labels and badge styles
    └── types/
        └── job.ts        # TypeScript types
```

## Getting started

### Prerequisites

- Python 3.12+
- Node 18+
- PostgreSQL 16+

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd JobTracker
```

### 2. Backend setup

```bash
cd backend

python3 -m venv venv
source venv/bin/activate

pip install django djangorestframework django-cors-headers psycopg2-binary python-dotenv
```

Create a `.env` file in `backend/`:

```
DEBUG=True
DB_NAME=jobtracker_db
DB_USER=jobtracker_user
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

Set up the database:

```bash
psql postgres
```

```sql
CREATE DATABASE jobtracker_db;
CREATE USER jobtracker_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE jobtracker_db TO jobtracker_user;
\q
```

Run migrations and start the server:

```bash
python manage.py migrate
python manage.py runserver
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Start the dev server:

```bash
npm run dev
```

The app will be running at `http://localhost:3000`.

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

## Features

- Add, edit, and delete job applications using a modal form
- Filter by application status and search by company or role
- Infinite scroll / paginated job list
- Sortable table columns on desktop
- Responsive mobile card view
- CSV import with create/update/skip feedback and toast notifications
- Status badges, totals, and stats cards for quick insights
- Backend REST API with detail, stats, and upload endpoints
