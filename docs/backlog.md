# Mini ATS — Backlog

## Phase 1 — Project foundation

- [X] Initialize Next.js application with TypeScript and Tailwind CSS
- [X] Verify application runs locally
- [X] Create Supabase project
- [X] Connect Next.js to Supabase
- [X] Configure environment variables

## Phase 2 — Database and authentication

- [X] Create database schema
- [X] Create customers table
- [X] Create profiles table
- [X] Create jobs table
- [X] Create candidates table
- [X] Create applications table
- [X] Configure Row Level Security
- [X] Implement login
- [X] Implement logout

## Phase 3 — Core customer workflow

- [X] Create job
- [X] View jobs
- [X] Add candidate
- [X] View candidates
- [X] Build candidate Kanban board
- [X] Move candidate between pipeline stages
- [X] Filter candidates by job
- [X] Filter candidates by candidate name

## Phase 4 — Admin workflow

### Account management

- [X] Create customer accounts
- [X] Create admin accounts
- [X] View customer and admin accounts
- [X] Edit customer accounts
- [X] Edit admin accounts
- [X] Delete customer accounts
- [X] Delete admin accounts
- [X] Prevent admin self-deletion

### Customer data management

- [X] Allow admin to access customer ATS functionality
- [X] Allow admin to view customer jobs
- [X] Allow admin to create jobs for customers
- [X] Allow admin to view customer candidates
- [X] Allow admin to add candidates
- [X] Allow admin to access customer Kanban boards
- [X] Allow admin to move candidates between pipeline stages
- [X] Allow admin to use job and candidate filters
- [X] Reuse existing Jobs, Candidates and Kanban functionality
- [X] Verify admin can manage customer data without duplicating customer workflow code

## Phase 5 — Application integration

- [X] Define authenticated application layout
- [X] Connect login to the appropriate application area based on role
- [X] Add customer navigation
- [X] Add admin navigation
- [X] Connect Jobs, Candidates and Kanban into the authenticated application
- [X] Connect Admin Dashboard into the authenticated application
- [X] Add route protection by authentication state
- [X] Add route protection by role
- [X] Verify logout returns user to login
- [X] Verify complete customer navigation
- [X] Verify complete admin navigation

## Phase 6 — MVP validation

- [X] Test customer login
- [X] Test admin login
- [X] Test customer data isolation
- [X] Test job creation
- [X] Test candidate creation
- [X] Test Kanban workflow
- [X] Test filters
- [X] Test admin account management
- [X] Test admin management of customer ATS data
- [X] Test complete customer workflow
- [X] Test complete admin workflow
- [X] Test authentication and route protection
- [X] Fix MVP-blocking bugs

## Phase 7 — Deployment

- [X] Deploy application
- [X] Configure production environment variables
- [X] Configure production Supabase settings
- [X] Test production authentication
- [X] Test deployed customer workflow
- [X] Test deployed admin workflow
- [X] Create demo admin account
- [X] Create demo customer account
- [X] Verify production build and CI

## Optional — AI extension

- [X] Define minimal CV assessment approach
- [X] Document the proposed AI architecture
- [ ] Implement AI-assisted CV assessment if time allows

## MVP improvements

### UI / Responsive

- [X] Improve Kanban responsive layout on mobile devices.
- [X] Enable horizontal scrolling for Kanban columns on small screens.
- [X] Improve candidate text visibility on mobile devices.

### Jobs

- [ ] Add Edit action to Jobs.
- [ ] Add Delete action to Jobs.
- [ ] Allow customers to edit and delete their own Jobs.
- [ ] Allow administrators to edit and delete Jobs while managing a customer's ATS.
- [ ] Define what happens to associated Candidates when a Job is deleted.

### Candidates

- [ ] Add Edit action to Candidates.
- [ ] Add Delete action to Candidates.
- [ ] Allow customers to edit and delete their own Candidates.
- [ ] Allow administrators to edit and delete Candidates while managing a customer's ATS.
- [ ] Add a notes field to candidate profiles.
- [ ] Allow administrators/customers to add and edit candidate notes.

### Hiring process

- [ ] Consider allowing the initial candidate stage to be selected during creation.
- [ ] Keep "Applied" as the default stage when no stage is selected.

### Account management

- [ ] Allow users to change their password.