# Mini ATS

Mini ATS is a lightweight Applicant Tracking System (ATS) built as an MVP to manage jobs, candidates, and recruitment pipelines.

The application supports two user roles:

- **Customers**, who manage their own jobs, candidates, and hiring process.
- **Administrators**, who manage customer and administrator accounts and can access customer ATS data when required.

The project focuses on the core functionality of an ATS while keeping the architecture simple, maintainable, and suitable for future extension.

## Project Status

✅ **MVP deployed and operational**

The core MVP has been implemented, validated, and deployed to production.

Development progress and future improvements are tracked in [`docs/backlog.md`](docs/backlog.md).

## Live Demo

The application is deployed and available at:

**Live Application:** https://mini-ats-three-henna.vercel.app/

Admin login credentials are provided separately.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)
- GitHub Actions
- Vercel

## Features

### Authentication and Authorization

- Login and logout with Supabase Auth
- Persistent authenticated sessions
- Customer and administrator roles
- Protected application routes
- Role-based access control

### Jobs

Customers can:

- Create jobs
- View their jobs

Administrators can access the same job workflow while managing a customer's ATS.

### Candidates

Customers can:

- Add candidates
- View candidates
- Associate candidates with jobs
- Search candidates by name
- Filter candidates by job

Administrators can access the same candidate workflow while managing a customer's ATS.

### Hiring Process

Mini ATS includes a Kanban-style recruitment pipeline with the following stages:

- Applied
- Screening
- Interview
- Offer
- Hired
- Rejected

Candidates can be moved between stages as they progress through the recruitment process.

The hiring process can also be filtered by job and searched by candidate name.

### Administration

Administrators have access to a dedicated administration area where they can:

- Create customer accounts
- Create administrator accounts
- View customer and administrator accounts
- Edit customer accounts
- Edit administrator accounts
- Delete customer accounts
- Delete administrator accounts
- Access a customer's ATS
- Manage customer jobs
- Manage customer candidates
- Manage customer hiring pipelines

Administrators are prevented from deleting their own administrator account.

## Security and Data Isolation

Mini ATS uses PostgreSQL through Supabase.

Row Level Security (RLS) policies enforce data-access rules and customer data isolation.

Customers can access only the ATS data associated with their account. Authorized administrators can access customer ATS data through the administrative workflow.

Sensitive administrative operations use server-side Supabase credentials and do not expose the service role key to the browser.

## Continuous Integration

The repository uses GitHub Actions to validate changes before they are merged into `main`.

For pull requests targeting `main`, the CI workflow:

1. Installs dependencies with `npm ci`
2. Runs ESLint
3. Builds the Next.js application
4. Validates TypeScript as part of the Next.js build process

## Deployment

Mini ATS is deployed with Vercel.

The production deployment is connected to the GitHub repository and uses the `web` directory as the Next.js application root.

Production environment variables are configured in Vercel, while Supabase provides authentication, PostgreSQL storage, and Row Level Security.

## Local Setup

### 1. Clone the repository

```bash id="7pvy1f"
git clone https://github.com/JuanAndradeAI/mini-ATS.git
cd mini-ATS
```

### 2. Install dependencies

The Next.js application is located inside the `web` directory.

```bash id="wsk00z"
cd web
npm install
```

### 3. Configure environment variables

Create a `.env.local` file inside the `web` directory:

```env id="ynrq1h"
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` is a server-side secret. It must never be exposed in client-side code or committed to the repository.

### 4. Configure the database

Database definitions are available in:

```text id="drvr8v"
database/
├── schema.sql
└── policies.sql
```

These files contain the database schema and Row Level Security policies required by the application.

### 5. Run the application

From the `web` directory:

```bash id="jys8c6"
npm run dev
```

Open:

```text id="hlyagj"
http://localhost:3000
```

## Project Structure

```text id="1i6yvs"
mini-ATS/
├── .github/
│   └── workflows/
│       └── ci.yml
├── database/
│   ├── schema.sql
│   └── policies.sql
├── docs/
│   ├── architecture.md
│   ├── assumptions.md
│   ├── backlog.md
│   └── requirements.md
└── web/
    ├── public/
    ├── src/
    │   ├── app/
    │   │   ├── admin/
    │   │   ├── api/
    │   │   ├── candidates/
    │   │   ├── jobs/
    │   │   ├── kanban/
    │   │   └── login/
    │   ├── components/
    │   └── lib/
    └── package.json
```

## Documentation

Additional project documentation is available in the `docs` directory:

- [`requirements.md`](docs/requirements.md) — MVP requirements
- [`architecture.md`](docs/architecture.md) — application architecture
- [`assumptions.md`](docs/assumptions.md) — project assumptions and design decisions
- [`backlog.md`](docs/backlog.md) — implementation progress and improvements

## MVP Validation

The main customer and administrator workflows have been tested locally and in production, including:

- Customer and administrator authentication
- Customer data isolation
- Job creation
- Candidate creation
- Candidate pipeline management
- Job filtering
- Candidate search
- Administrator account management
- Administrator access to customer ATS data
- Authentication and route protection
- Production deployment and authentication

## AI CV Assessment — Proposed Approach

The AI CV assessment was not implemented in the MVP, but the proposed approach would be:

1. The recruiter provides the candidate's CV.
2. The application combines the CV content with the job description.
3. The Next.js backend sends this information to an AI model through an API.
4. The prompt asks the model to identify:
   - Relevant experience and skills.
   - Job requirements supported by the CV.
   - Requirements that are missing or unclear.
   - Suggested questions for the recruiter to verify during an interview.
5. The structured result is displayed in the ATS for human review.

The AI would be used as a support tool rather than making hiring decisions. It would not automatically rank, accept, or reject candidates.

The API key would be stored securely as a server-side environment variable and would not be exposed to the browser.