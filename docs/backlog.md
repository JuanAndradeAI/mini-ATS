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

- [ ] Deploy application
- [ ] Configure production environment variables
- [ ] Configure production Supabase settings
- [ ] Test production authentication
- [ ] Test deployed customer workflow
- [ ] Test deployed admin workflow
- [ ] Create demo admin account
- [ ] Create demo customer account
- [ ] Verify production build and CI

## Phase 8 — Delivery

- [ ] Complete README
- [ ] Document setup instructions
- [ ] Document assumptions
- [ ] Prepare demo data
- [ ] Record 5-minute demo
- [ ] Share live application
- [ ] Share admin credentials
- [ ] Share GitHub repository

## Optional — AI extension

- [ ] Define minimal CV assessment approach
- [ ] Implement AI-assisted CV assessment if time allows
- [ ] Document the proposed AI architecture