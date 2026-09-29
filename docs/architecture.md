# Mini ATS — Architecture

## Architecture Goal

Keep the system simple enough to ship quickly while maintaining a clear
separation between the user interface, authentication, authorization, and
application data.

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

The Next.js application provides the user interface for authentication,
jobs, candidates, the hiring pipeline, and administration.

### Backend

Supabase provides the main backend services required by the MVP.

#### Authentication

Supabase Auth manages user authentication and sessions.

#### Database

Supabase PostgreSQL stores the application data.

Main entities:

- Customers
- Profiles
- Jobs
- Candidates
- Applications

The `applications` table connects candidates with jobs and stores the
candidate's current stage in the hiring process.

#### Authorization

Supabase Row Level Security (RLS) enforces customer data isolation.

Customer users can access data associated with their own customer account.

Administrators can manage customer data through the administrative workflow.

Sensitive administrative operations are handled server-side and use
Supabase credentials that are not exposed to the browser.

## Deployment

- Application: Vercel
- Backend and database: Supabase
- Source control: GitHub
- Continuous Integration: GitHub Actions

Vercel is connected to the GitHub repository and deploys the Next.js
application.

GitHub Actions validates changes with linting and a production build before
changes are merged into `main`.

## High-Level Architecture

User
  |
  v
Next.js Application
  |
  +-- User Interface
  |
  +-- Server-side administrative operations
  |
  v
Supabase
  |
  +-- Authentication
  |
  +-- PostgreSQL
  |    |
  |    +-- customers
  |    +-- profiles
  |    +-- jobs
  |    +-- candidates
  |    +-- applications
  |
  +-- Row Level Security

## Architecture Decision

A separate standalone backend service is intentionally not included in the MVP.

Supabase already provides authentication, PostgreSQL storage, and Row Level
Security. Next.js also provides server-side functionality where required for
sensitive administrative operations.

Adding another backend service would increase development and deployment
complexity without providing enough value for the first version.