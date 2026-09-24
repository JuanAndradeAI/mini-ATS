# Mini ATS — Architecture

## Architecture goal

Keep the system simple enough to ship quickly while maintaining clear
separation between the user interface, authentication and application data.

## Technology stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

The frontend provides the user interface for authentication, jobs,
candidates, Kanban and administration.

### Backend

Supabase provides the backend services required by the MVP.

#### Authentication

Supabase Auth manages user authentication and sessions.

#### Database

Supabase PostgreSQL stores the application data.

Main entities:

- Customers
- Profiles
- Jobs
- Candidates

#### Authorization

Supabase Row Level Security (RLS) will restrict customer users to data
belonging to their own customer.

Admin users will be allowed to manage data across customers.

## Deployment

- Application: Vercel
- Backend and database: Supabase
- Source control: GitHub

## High-level architecture

User
  |
  v
Next.js application
  |
  v
Supabase
  |
  +-- Authentication
  |
  +-- PostgreSQL
       |
       +-- customers
       +-- profiles
       +-- jobs
       +-- candidates

## Architecture decision

A separate custom backend API is intentionally not included in the MVP.

Supabase already provides authentication, database access and authorization
capabilities. Adding another backend service would increase development and
deployment complexity without providing enough value for the first version.