# JobTracker

A full-stack job application tracker built with Next.js, Django, and PostgreSQL.

## Stack

- **Frontend** — Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend** — Django, Django REST Framework
- **Database** — PostgreSQL

## Project structure

```
JobTracker/
├── backend/
│   ├── config/          # Django project settings and URLs
│   ├── jobs/            # Jobs app — models, views, serializers, utils
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── utils.py
│   ├── data/            # Drop your jobs.csv here for local CSV sync
│   ├── manage.py
│   └── .env             # Local environment variables (not committed)
└── frontend/
    ├── app/
    │   └── page.tsx     # Main job table view
    ├── components/
    │   ├── JobTable.tsx
    │   ├── JobModal.tsx
    │   └── StatCards.tsx
    ├── lib/
    │   ├── api.ts        # Fetch helpers for all endpoints
    │   └── constants.ts  # Shared status options and colors
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
GRANT ALL PRIVILEGES ON DATABASE jobtracker TO jobtracker_user;
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

| Method | URL                 | Description                                    |
| ------ | ------------------- | ---------------------------------------------- |
| GET    | `/api/jobs/`        | List all jobs, supports `?status=`, `?search=` |
| POST   | `/api/jobs/create/` | Create a new job                               |
| GET    | `/api/jobs/<id>/`   | Get a single job                               |
| PATCH  | `/api/jobs/<id>/`   | Update a job                                   |
| DELETE | `/api/jobs/<id>/`   | Delete a job                                   |
| GET    | `/api/jobs/stats/`  | Counts by status                               |
| POST   | `/api/jobs/sync/`   | Sync from local CSV at `backend/data/jobs.csv` |

## Features

- Add, edit, and delete job applications
- Filter by application status
- Search by company or role
- Sortable table columns
- Status badges with color coding
- Skeleton loading state on initial load
