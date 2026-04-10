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
- CSV import with create/update/skip reporting
- Backend sanitization and validation for job form and CSV input
- Status summary cards and total application count

## Useful files

- `app/page.tsx` — main page layout and state management
- `components/JobTable.tsx` — sortable job list and responsive views
- `components/JobModal.tsx` — add/edit/delete modal
- `components/CsvUploadButton.tsx` — CSV upload UI and toast feedback
- `lib/api.ts` — API helpers for backend endpoints
- `lib/constants.ts` — shared status labels and badge styles
- `types/job.ts` — TypeScript job and API response types
