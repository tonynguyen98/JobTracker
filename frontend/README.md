# Frontend

Next.js 16 (App Router) application for the JobTracker. Follows an MVC layout:

- `app/` — Controller: routing, page state, data fetching
- `components/` — View: all UI components, grouped by domain
- `lib/` — Model: data types, API calls, app constants

Connects to the Django backend at `NEXT_PUBLIC_API_URL`.

## Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project structure

```
frontend/
├── app/                        # Controller
│   ├── page.tsx                # Main page — state, fetching, layout
│   └── layout.tsx
├── components/                 # View
│   ├── analytics/
│   │   ├── Analytics.tsx       # Velocity chart + status breakdown
│   │   └── StatCards.tsx       # Scrollable status filter chips
│   ├── jobs/
│   │   ├── JobModal.tsx        # Add / edit / delete modal
│   │   ├── JobSearchReport.tsx # Full-screen end-of-search report
│   │   └── JobTable.tsx        # Sortable table + mobile card view
│   └── CsvUploadButton.tsx     # CSV import button with toast feedback
└── lib/                        # Model
    ├── api.ts                  # Typed wrappers for every backend endpoint
    ├── constants.ts            # STATUS_OPTIONS, STATUS_GROUPS, getStatusStyle()
    └── types.ts                # Job, JobStats, PaginatedJobs interfaces
```

## Features

- Infinite scroll job list with backend pagination
- Search by company or job title
- Filter by application status
- Sortable table columns on desktop
- Responsive mobile card view
- Add/edit/delete jobs through a modal form
- Analytics dashboard with application velocity chart (daily/weekly toggle) and status breakdown
- Job Search Report — full-screen end-of-search summary including:
  - Pipeline funnel (Applied → Screened → Interviewed → Offer) with drop-off percentages
  - Final outcome breakdown (No Reply, Rejected, No Offer, Offer, Accepted)
  - Fun facts grid (response rate, interview rate, peak week, most applied role, etc.)
  - Daily activity timeline
  - Full status breakdown with percentages
  - Print / Save as PDF via browser print dialog
- CSV import with create/update/skip reporting
- Status summary cards and total application count
