# Screening Platform

AI-powered candidate screening tool. Recruiters create screening links; candidates fill in a form; results are emailed as PDF reports.

## Architecture

```
screening-app/
├── backend/          Express 5 API + PostgreSQL + Claude AI
│   ├── backend/
│   │   └── server.js # Single entry-point (routes, DB, email, PDF)
│   ├── package.json
│   └── .env          # See backend/README.md for required vars
├── frontend/         React 18 + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── App.jsx           # Router + nav + auth gate
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Screenings.jsx      # Recruiter dashboard
│   │       ├── ScreeningDetail.jsx # Submissions for one role
│   │       ├── CreateRole.jsx      # Create + edit a screening
│   │       ├── ScreeningForm.jsx   # Public candidate form
│   │       ├── BookingPage.jsx     # Public candidate booking page
│   │       ├── Settings.jsx        # Recruiter availability settings
│   │       └── Success.jsx         # Post-submission confirmation
│   ├── package.json
│   └── .env          # See frontend/README.md for required vars
├── .gitignore
└── README.md         # This file
```

## Quick Start

### 1. Backend
```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL, ANTHROPIC_API_KEY, SMTP_*, JWT_SECRET, FRONTEND_URL
npm install
npm run dev            # http://localhost:3001
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:3001
npm install
npm run dev            # http://localhost:5173
```

Open **http://localhost:5173** — you will land on the login page.

## Key Env Vars

| Where | Variable | Example |
|---|---|---|
| backend | `DATABASE_URL` | `postgresql://…` (Neon or local Postgres) |
| backend | `ANTHROPIC_API_KEY` | `sk-ant-…` |
| backend | `FRONTEND_URL` | `http://localhost:5173` |
| backend | `JWT_SECRET` | random string |
| backend | `SMTP_HOST/PORT/USER/PASS` | Gmail SMTP or equivalent |
| frontend | `VITE_API_URL` | `http://localhost:3001` |

## Branding

| Audience | Brand | Primary colour |
|---|---|---|
| Recruiter (login, dashboard, create) | Starcircle | `#001463` (navy) |
| Candidate (screening form, booking, success) | SquareMoon | `#0d1b2a` (deep navy) |

## Auth

- Only `@starcircle.com` email addresses can register.
- JWTs are signed with `JWT_SECRET`, valid for 7 days.
- The candidate-facing screening form (`/screen/:slug`) and booking page (`/book/:slug`) are fully public — no auth required. The screening form includes a honeypot field and a math CAPTCHA to reduce spam.

## How It Works

1. A recruiter registers/logs in and sets their availability (days + hours) in Settings.
2. The recruiter creates a screening (company, job, questions). Claude generates questions and a company + role introduction.
3. The recruiter receives a booking link and a screening form link (plus a PDF report via email).
4. The recruiter shares the booking link with candidates.
5. A candidate opens the booking link, picks a date/time slot, and confirms. The recruiter is notified by email.
6. After the call, the recruiter opens the screening form from the Bookings tab and fills in the candidate's details and answers.
7. The recruiter receives a PDF report with the screening results via email.
8. The recruiter can view all submissions and bookings in the dashboard and open/close screenings.

## Deployment Targets

| Service | What it runs |
|---|---|
| Vercel | Frontend (set `VITE_API_URL` to the Railway backend URL) |
| Railway | Backend (set all backend env vars; `npm start` runs `node backend/server.js`) |
| Neon | PostgreSQL database (free tier is sufficient to start) |

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for full details.
