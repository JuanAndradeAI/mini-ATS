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

- [ ] Allow admin to access customer ATS functionality
- [ ] Allow admin to view customer jobs
- [ ] Allow admin to create jobs for customers
- [ ] Allow admin to view customer candidates
- [ ] Allow admin to add candidates
- [ ] Allow admin to access customer Kanban boards
- [ ] Allow admin to move candidates between pipeline stages
- [ ] Allow admin to use job and candidate filters
- [ ] Reuse existing Jobs, Candidates and Kanban functionality
- [ ] Verify admin can manage customer data without duplicating customer workflow code

## Phase 5 — Application integration

- [ ] Define authenticated application layout
- [ ] Connect login to the appropriate application area based on role
- [ ] Add customer navigation
- [ ] Add admin navigation
- [ ] Connect Jobs, Candidates and Kanban into the authenticated application
- [ ] Connect Admin Dashboard into the authenticated application
- [ ] Add route protection by authentication state
- [ ] Add route protection by role
- [ ] Verify logout returns user to login
- [ ] Verify complete customer navigation
- [ ] Verify complete admin navigation

## Phase 6 — MVP validation

- [ ] Test customer login
- [ ] Test admin login
- [ ] Test customer data isolation
- [ ] Test job creation
- [ ] Test candidate creation
- [ ] Test Kanban workflow
- [ ] Test filters
- [ ] Test admin account management
- [ ] Test admin management of customer ATS data
- [ ] Test complete customer workflow
- [ ] Test complete admin workflow
- [ ] Test authentication and route protection
- [ ] Run lint
- [ ] Run production build
- [ ] Fix MVP-blocking bugs

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