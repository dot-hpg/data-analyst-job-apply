# Data Analyst Job Tracker

A small static website that tracks every data analyst job found and applied to during the job search: company, role, location / remote type, link, dates, status, fit score and notes.

**Search focus:** fully remote roles open to candidates in India (worldwide / APAC remote), with Hyderabad-based roles as a fallback.

## Using it

- Open the site (GitHub Pages, see below) to browse, search, filter by status or work type, and sort by fit or date.
- Change a job's status from its dropdown, or click **Edit** / **+ Add job**. Edits are saved in your browser only.
- To make edits permanent, click **Export JSON** and commit the downloaded file as `data/jobs.json`.
- **Export CSV** downloads the list for Excel / Google Sheets.

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

## Deploying to GitHub Pages

The workflow in `.github/workflows/pages.yml` deploys the site on every push to `main`.
One-time setup: in the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
The site will then be at `https://dot-hpg.github.io/data-analyst-job-apply/`.

To preview locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
