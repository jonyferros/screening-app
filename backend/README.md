# Backend — Screening Platform

Express 5 API server backed by PostgreSQL (Neon) and the Anthropic Claude API.

## Running

```bash
npm install
npm run dev      # nodemon watch mode
npm start        # production (node backend/server.js)
```

The server starts on the port defined by `PORT` (default `3001`).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon cloud or local) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key — used to generate screening questions |
| `PORT` | No | HTTP port (default `3001`) |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP port (typically `587`) |
| `SMTP_USER` | Yes | SMTP sender address |
| `SMTP_PASS` | Yes | SMTP password / app password |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs |
| `FRONTEND_URL` | Yes | Frontend origin — used for CORS and screening URLs |

## Database

Tables are created / migrated automatically on startup.

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `email` | text unique | Must end in `@starcircle.com` |
| `password` | text | bcrypt hash (cost 10) |
| `created_at` | timestamptz | Default `NOW()` |

### `roles`
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `company_name` | text | |
| `job_title` | text | |
| `job_description` | text | |
| `role_introduction` | text | AI-generated, editable |
| `screening_questions` | jsonb | Array of question strings |
| `url_slug` | text unique | `<company>-<random>` — used in the public screening URL |
| `notification_email` | text | Set to the creating user's email at creation time |
| `status` | text | `open` (default) or `closed` |

### `screenings`
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `role_id` | int FK → roles | |
| `candidate_name` | text | |
| `candidate_email` | text | |
| `expected_salary_amount` | text | |
| `expected_salary_currency` | text | |
| `current_location` | text | |
| `work_preference` | text | Remote / Hybrid / On-site |
| `visa_status` | text | |
| `visa_sponsorship_details` | text | nullable |
| `notice_period_weeks` | int | nullable |
| `availability_start_date` | text | nullable |
| `role_specific_answers` | jsonb | Array of `{ question, answer }` |
| `recruiter_notes` | text | nullable |
| `recruiter_email` | text | nullable |
| `submitted_at` | timestamptz | Default `NOW()` |

## API Reference

### Auth

#### `POST /api/auth/register`
Create a new recruiter account. Email must end in `@starcircle.com`.

**Body:** `{ email, password }`
**Response:** `{ token, email }`

#### `POST /api/auth/login`
Authenticate and receive a JWT.

**Body:** `{ email, password }`
**Response:** `{ token, email }`

#### `GET /api/auth/status`
Returns whether any users exist (used by the frontend to decide login vs register).

**Response:** `{ hasUsers: boolean }`

### Roles

#### `POST /api/roles` — *auth required*
Create a role: calls Claude to generate screening questions and a role introduction, saves to DB, emails a PDF report to the authenticated user, and returns the screening URL.

**Body:**
```json
{
  "company_name": "string",
  "job_title": "string",
  "job_description": "string",
  "selected_questions": ["string"]
}
```
`selected_questions` are included verbatim; Claude generates the remainder up to 6 total.

**Response:**
```json
{
  "role_id": 1,
  "url_slug": "techcorp-abc123",
  "screening_url": "http://localhost:5173/screen/techcorp-abc123",
  "role_introduction": "…",
  "screening_questions": ["…"]
}
```

#### `GET /api/roles` — *auth required*
List all roles owned by the authenticated user, with submission counts.

**Query params:**
| Param | Description |
|---|---|
| `since` | ISO 8601 timestamp — if provided, `new_submission_count` reflects submissions after this time |

**Response:**
```json
{
  "roles": [
    {
      "id": 1,
      "company_name": "…",
      "job_title": "…",
      "url_slug": "…",
      "status": "open",
      "notification_email": "…",
      "submission_count": 3,
      "new_submission_count": 1
    }
  ]
}
```

#### `GET /api/roles/:slug` — *public*
Fetch a role by its URL slug. Used by the candidate-facing screening form.

**Response:**
```json
{
  "role_id": 1,
  "company_name": "…",
  "job_title": "…",
  "role_introduction": "…",
  "screening_questions": ["…"]
}
```

#### `PATCH /api/roles/:id` — *auth required*
Update role fields. Supports partial updates — only send the fields you want to change.

**Body (all optional):**
```json
{
  "role_introduction": "…",
  "screening_questions": ["…"],
  "status": "open | closed"
}
```

**Response:** `{ status: "updated" }`

### Screenings (Submissions)

#### `POST /api/screenings` — *public*
Submit a candidate screening. On success, generates a PDF report and emails it to the role's `notification_email`.

**Body:**
```json
{
  "role_id": 1,
  "candidate_name": "…",
  "candidate_email": "…",
  "expected_salary_amount": "…",
  "expected_salary_currency": "USD",
  "current_location": "…",
  "work_preference": "Remote",
  "visa_status": "…",
  "visa_sponsorship_details": "…",
  "notice_period_weeks": 4,
  "availability_start_date": "…",
  "role_specific_answers": [{ "question": "…", "answer": "…" }],
  "recruiter_notes": "…",
  "recruiter_email": "…"
}
```

**Response:**
```json
{
  "screening_id": 1,
  "status": "submitted",
  "submitted_at": "2026-02-04T…"
}
```

#### `GET /api/screenings/role/:roleId` — *auth required*
List all submissions for a given role, ordered newest first.

**Response:**
```json
{
  "screenings": [ /* full row objects */ ]
}
```

### Health

#### `GET /api/health`
Liveness probe. Returns `{ status: "ok" }`.

## Email & PDF

Two email flows run as fire-and-forget tasks after the HTTP response is sent:

1. **Role created** — a PDF report (role intro, questions, screening link) is generated with PDFKit and emailed to the authenticated user.
2. **Screening submitted** — a PDF report (candidate details, Q&A, recruiter notes) is generated and emailed to the role's `notification_email`.

Both use Nodemailer with the SMTP credentials in `.env`.
