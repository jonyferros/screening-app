# Frontend — Screening Platform

React 18 + Vite + Tailwind CSS v4 single-page application.

## Running

```bash
npm install
npm run dev      # dev server (http://localhost:5173)
npm run build    # production build → dist/
npm run preview  # preview production build locally
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (e.g. `http://localhost:3001`) |

## Pages & Routes

| Route | Page | Auth | Description |
|---|---|---|---|
| `/login` | Login | — | Recruiter sign-in (Starcircle branded) |
| `/register` | Register | — | Recruiter account creation (`@starcircle.com` only) |
| `/` | Screenings | Yes | Dashboard — lists all roles with open/closed filter tabs and "new submission" badges |
| `/create` | CreateRole | Yes | Create a new screening — fill in job details, select/add questions, AI generates the rest |
| `/screenings/:roleId` | ScreeningDetail | Yes | View all candidate submissions for a given role (expandable cards) |
| `/screen/:slug` | ScreeningForm | — | Public candidate-facing screening form (SquareMoon branded, includes CAPTCHA) |
| `/success` | Success | — | Confirmation page shown after a candidate submits |

## Auth Flow

- On login/register the backend returns a JWT. It is stored in `localStorage` alongside the user's `email`.
- `lastLogin` is also saved to `localStorage` on login and updated each time the Screenings dashboard loads — used to compute "new" submission badges.
- Protected routes redirect to `/login` if no token is present. The nav bar only renders when a user is authenticated.
- Logout clears `token`, `email`, and `lastLogin` from `localStorage`.

## Branding

### Recruiter-facing (Starcircle)
- Logo: star-in-circle SVG with fill `#001463`
- Brand name: **starcircle**
- Buttons: `bg-slate-900` / `hover:bg-slate-800`
- Used on: Login, Register, nav bar, CreateRole, Screenings, ScreeningDetail

### Candidate-facing (SquareMoon)
- Header bar: deep navy `bg-[#0d1b2a]` with crescent moon SVG icon and "SquareMoon" text in white
- Submit button: `bg-[#0d1b2a]`
- Used on: ScreeningForm, Success

## CAPTCHA (ScreeningForm)

The candidate form uses a lightweight client-side spam guard:
- **Honeypot field** — a visually hidden input; if filled by a bot the submission is silently rejected.
- **Math CAPTCHA** — a simple addition problem regenerated on each load and on the refresh button click. Validated before the form submits.

No external CAPTCHA service is required.

## Page Details

### Screenings (Dashboard)
- Fetches roles from `GET /api/roles?since=<lastLogin>`.
- Displays open roles by default; toggle to the Closed tab to see closed ones.
- Each card shows: job title, company, open/closed badge, total submission count, a blue "N new" badge if there are submissions since last visit, and the screening URL.
- Clicking a card navigates to ScreeningDetail; the Close/Reopen button toggles status independently.
- After roles load, `lastLogin` is updated so badges clear on next visit.

### CreateRole
- Multi-step form: company name, job title, job description, preset + custom screening questions, then submit.
- On success the backend returns AI-generated questions and intro — displayed in an editable result view with inline editing (pencil icon) for both the intro and individual questions.
- Edits are PATCHed to the backend immediately on save.

### ScreeningDetail
- Receives role data via React Router location state (passed from the dashboard card).
- Fetches submissions from `GET /api/screenings/role/:roleId`.
- Each submission is a collapsible card: summary row with candidate name, email, salary, work preference, location, and date; expanded view adds visa status, availability, full Q&A, and recruiter notes.

### ScreeningForm (Candidate)
- Loads role details by slug from `GET /api/roles/:slug`.
- Candidate fills in personal details, salary expectations, work preference, visa info, availability, and answers to each screening question.
- Includes optional recruiter notes field.
- Submits to `POST /api/screenings`; on success navigates to `/success`.
