# Frontend

This frontend is a [Next.js](https://nextjs.org) application built with the App Router, TypeScript, and Tailwind CSS.

It connects to the Django backend at `NEXT_PUBLIC_API_URL` and provides a responsive job application tracker UI.

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
- Backend sanitization and validation for job form and CSV input
- Status summary cards and total application count

## Useful files

- `app/page.tsx` — main page layout and state management
- `components/Analytics.tsx` — velocity chart and status breakdown panel
- `components/JobSearchReport.tsx` — full-screen job search report with funnel and stats
- `components/JobTable.tsx` — sortable job list and responsive views
- `components/JobModal.tsx` — add/edit/delete modal
- `components/CsvUploadButton.tsx` — CSV upload UI and toast feedback
- `lib/api.ts` — API helpers for backend endpoints
- `lib/constants.ts` — shared status labels and badge styles
- `types/job.ts` — TypeScript job and API response types
