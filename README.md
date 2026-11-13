# Data Analyst Job Tracker

A small static website that tracks every data analyst job found and applied to during the job search: company, role, location / remote type, link, dates, status, fit score and notes.

**Search focus:** fully remote roles open to candidates in India (worldwide / APAC remote), with Hyderabad-based roles as a fallback.

## Using it

- **Overview:** progress toward the 500-application goal (count, ring, milestones, pace and projected finish date), streak, today's count, and KPI tiles (queue, interviews, response rate, remote share, average fit).
- **Pipeline:** one tile per status; click a stage to filter the list.
- **Insights:** road-to-500 chart with projection, applications per day, portal and location breakdowns (click a bar to filter), and the skills employers ask for (click a skill to search it).
- **Applications:** search (press `/`), filter chips for status, portal, location and work type, and three views: cards, a sortable table, and a board where you drag a card to change its status. Click any company for a detail panel with the posting link, notes, recruiter and cover note. Links like `#job=<id>` open a job directly.
- Edits (status changes, **+ Add job**, **Edit**) are saved in your browser only. Use the download menu → **Export JSON** and commit the file as `data/jobs.json` to make them permanent; **Export CSV** is for Excel / Google Sheets.
- Light and dark themes follow your system, with a toggle in the top bar.

## Data format

`data/jobs.json` holds `{ "jobs": [ ... ] }`. Each job:

| Field | Meaning |
| --- | --- |
| `id` | Unique slug |
| `company`, `role` | Employer and job title |
| `location` | Location text from the posting |
| `work_type` | `Remote (Worldwide)`, `Remote (India)`, `Remote (APAC)`, `Hybrid` or `On-site` |
| `link` | URL of the posting |
| `status` | `Shortlisted`, `Ready to apply`, `Applied`, `Interviewing`, `Offer`, `Rejected` or `Skipped` |
| `fit_score` | 0–100 match against the resume |
| `date_found`, `date_applied` | `YYYY-MM-DD` |
| `salary`, `source`, `skills`, `why_fit`, `notes` | Extra detail |
| `cover_note` | Tailored cover note, shown with a Copy button |

## Deploying to Vercel

1. Go to https://vercel.com/new and import `dot-hpg/data-analyst-job-apply`.
2. Framework preset: **Other**. Leave build command and output directory empty (it is a static site).
3. Deploy. Every push to `main` (for example a new `data/jobs.json`) redeploys automatically.

`data/activity.json` holds the activity log shown at the bottom of the page.

## Deploying to GitHub Pages

The workflow in `.github/workflows/pages.yml` deploys the site on every push to `main`.
One-time setup: in the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
The site will then be at `https://dot-hpg.github.io/data-analyst-job-apply/`.

To preview locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
