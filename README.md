# Mini ATS

Mini ATS is a small Applicant Tracking System (ATS) built as an MVP to manage jobs and candidates through a simple recruitment workflow.

The goal of this project is to build the core functionality of an ATS while keeping the application simple and easy to maintain.

## Project Status

🚧 **In development**

The core project structure is in place and development of the MVP is currently ongoing.

Detailed development progress and upcoming tasks are tracked in [`docs/backlog.md`](docs/backlog.md).

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- GitHub Actions

## Current Functionality

The application currently includes:

- Authentication with Supabase Auth
- Login and logout
- Persistent user sessions
- PostgreSQL database through Supabase
- Row Level Security (RLS) policies
- Environment-based Supabase configuration
- Continuous Integration with GitHub Actions

## Continuous Integration

The repository uses GitHub Actions to automatically validate changes before they are merged into `main`.

For every pull request targeting `main`, the CI workflow:

1. Installs the project dependencies with `npm ci`
2. Runs ESLint
3. Builds the Next.js application

The build also validates the TypeScript code as part of the Next.js build process.

## Local Setup

Clone the repository:

```bash
git clone https://github.com/JuanAndradeAI/mini-ATS.git
cd mini-ATS
```

Install the application dependencies:

```bash
cd web
npm install
```

Create a `.env.local` file inside the `web` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Project Structure

```text
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
    ├── src/
    │   ├── app/
    │   └── lib/
    └── package.json
```

## Documentation

Additional project documentation can be found in the `docs` directory:

- [`requirements.md`](docs/requirements.md) — MVP requirements
- [`architecture.md`](docs/architecture.md) — project architecture
- [`assumptions.md`](docs/assumptions.md) — project assumptions and decisions
- [`backlog.md`](docs/backlog.md) — development progress and remaining tasks
