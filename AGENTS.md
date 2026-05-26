# JobTracker — Agent Guide

Personal full-stack job application tracker. The owner is actively using this to manage a job search, so data is real and the status semantics below are load-bearing.

---

## Status semantics

These are not arbitrary labels. Each has a precise meaning that drives how stats, the report funnel, and the analytics panel behave. Do not rename or reorder them without updating every place listed under each entry.

| Status | Meaning |
|---|---|
| Not Started | Saved for later — not yet submitted |
| Applied | Submitted, no contact yet |
| Contacted | Company reached out / initial screen |
| Coding Assessment | Technical screen / take-home sent |
| Next Round Confirmed | Interview slot booked |
| Interview Scheduled | Interview on calendar |
| Interviewed | Interview completed, awaiting decision |
| Wait Next Round | Post-interview, invited to continue |
| Offer | **Written offer received** |
| No Reply | Had contact, then ghosted after follow-up |
| No Offer | Went through the full process, then rejected |
| Rejected | Rejected via automated/form response — no human contact |
| Accepted | Offer accepted |

**Canonical order** is defined in `frontend/lib/constants.ts → STATUS_OPTIONS`. `orderStatusEntries()` in the same file sorts any status map by this order. Always use it when displaying statuses.

**Status groupings used in computed metrics:**

```
SCREENED   = Contacted | Coding Assessment | Interview Scheduled |
             Next Round Confirmed | Interviewed | Wait Next Round |
             No Reply | No Offer | Offer | Accepted
             → "company replied in any form"

INTERVIEWED = Interview Scheduled | Next Round Confirmed | Interviewed |
              Wait Next Round | No Offer | Offer | Accepted
              → "reached interview stage"

OFFERED     = Offer | Accepted
              → "received a written offer"

TERMINAL    = No Reply | No Offer | Rejected | Offer | Accepted
              → "no longer active"

ACTIVE      = everything not in TERMINAL and not "Not Started"
```

The backend `job_stats` view uses its own equivalent sets — keep them in sync if statuses change:
- `terminal` in `views.py` governs the `active` count
- `responded` excludes `Not Started`, `Applied`, and `No Reply` for `response_rate`

---

## Architecture

```
frontend/   Next.js 16 (App Router) · TypeScript · Tailwind CSS 4
backend/    Django · Django REST Framework · PostgreSQL
```

Frontend talks to backend via `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api`). All API helpers live in `frontend/lib/api.ts`.

---

## Frontend

### Key files

| File | Role |
|---|---|
| `app/page.tsx` | Root page — state, data fetching, layout orchestration |
| `components/Analytics.tsx` | Velocity bar chart + status breakdown panel |
| `components/JobSearchReport.tsx` | Full-screen end-of-search report modal |
| `components/JobTable.tsx` | Sortable table (desktop) + card list (mobile) |
| `components/JobModal.tsx` | Add / edit / delete modal form |
| `components/StatCards.tsx` | Horizontally scrollable status filter chips |
| `components/CsvUploadButton.tsx` | CSV import button with toast feedback |
| `lib/api.ts` | Typed wrappers for every backend endpoint |
| `lib/constants.ts` | `STATUS_OPTIONS`, `getStatusStyle()`, `orderStatusEntries()` |
| `types/job.ts` | `Job`, `JobStats`, `PaginatedJobs`, and related interfaces |

### No external chart libraries

All visualizations are built with plain React, Tailwind CSS, and inline SVG. **Do not add Recharts, Chart.js, D3, or similar.** The existing patterns (percentage-height flex bars, centered stepped divs for funnels, SVG connectors) are intentional and keep the bundle small.

### JobSearchReport — funnel design

The pipeline funnel uses **fixed stepped widths** (100% → 76% → 54% → 34%), not widths proportional to count. This is intentional: actual drop-offs can be extreme (e.g. 446 applied, 18 screened) and proportional widths produce unreadably narrow bars. The real numbers and percentages are displayed as text inside each bar.

### Mobile

The header shows a compact icon-only version of the Job Report button on mobile (`sm:hidden` label, icon always visible). The CSV upload button is desktop-only (`hidden sm:flex`). When adding header actions, follow this pattern — icon on mobile, full label on desktop.

### Print / PDF

`JobSearchReport` supports `window.print()` via a "Save as PDF" button. Print-specific styles use Tailwind's `print:` variant. The sticky toolbar has `print:hidden`; report sections have `print:shadow-none print:border-gray-300`. Do not use `@media print` blocks in separate CSS files — keep it in the component with Tailwind.

### Data fetching pattern

`page.tsx` uses three data sources:
- `getJobs()` — paginated, filtered, drives the visible table
- `getStats()` — aggregated counts and time-series for Analytics and StatCards
- `getAllJobs()` — fetches every page (100 per request) for the report modal

Mutations (`createJob`, `updateJob`, `deleteJob`) always trigger both `fetchJobs()` and `fetchStats()` to keep everything in sync.

---

## Backend

### Key files

| File | Role |
|---|---|
| `jobs/models.py` | `Job` model — all fields are optional except `company_name` and `job_title` |
| `jobs/views.py` | All API views — list, create, detail, stats, upload-csv |
| `jobs/serializers.py` | DRF serializer for `Job` |
| `jobs/sanitizers.py` | Cleans input before validation (called for both form and CSV) |
| `jobs/utils.py` | CSV parsing — column name normalization and row mapping |

### CSV upsert key

Existing jobs are matched on the tuple `(company_name.lower(), job_title.lower(), date_applied)`. Only `job_link`, `type_of_job`, `salary_annual`, `application_status`, and `notes` are updated on match. Rows with no changes are skipped and reported separately. This key is defined in `views.upload_csv` — update it if the model changes.

### Stats computation

`job_stats` does one queryset fetch (`values('application_status', 'date_applied')`) and processes everything in Python to avoid N+1 queries. The 30-day daily series and the full weekly series (from first application to today) are both computed here. `top_companies` is returned as an empty list — the field exists in the response contract but is not yet populated.

---

## Things to avoid

- **Don't rename statuses** without updating `STATUS_OPTIONS` in `constants.ts`, the grouping arrays in `JobSearchReport.tsx`, and the terminal/responded sets in `views.py`.
- **Don't add chart libraries** — use the existing CSS/SVG patterns.
- **Don't use proportional widths for the funnel** — fixed stepped widths are correct.
- **Don't skip `orderStatusEntries()`** when rendering status lists — raw `Object.entries()` will produce inconsistent ordering.
- **Don't forget mobile** — test any header or report UI change at narrow viewports.
