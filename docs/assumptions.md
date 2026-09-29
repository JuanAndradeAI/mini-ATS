# Mini ATS — Assumptions

To keep the MVP simple, focused, and deliverable within the challenge timeframe, the following assumptions and scope decisions were used.

## Customers and users

- A customer represents one company or organization.
- A customer can have one or more user accounts.
- Customer users can only access ATS data belonging to their own customer.
- Administrator users can access and manage data across customers.
- User accounts are created by an administrator.
- Public user registration is not required for the MVP.
- The application supports two roles: `admin` and `customer`.

## Jobs

- A job belongs to one customer.
- A job contains a title and an optional description.
- Customer users can create and view jobs belonging to their customer.
- Administrators can create and view jobs while managing a customer's ATS.
- Editing and deleting jobs are outside the current MVP scope.

## Candidates

- A candidate belongs to one customer.
- Candidate profile information in the MVP includes:
  - First name
  - Last name
  - Email
  - Phone
  - LinkedIn URL
- Candidates are associated with jobs through applications.
- When a candidate is added to a job, the application starts in the `applied` stage.
- Customer users can create and view candidates belonging to their customer.
- Administrators can create and view candidates while managing a customer's ATS.
- Editing and deleting candidates are outside the current MVP scope.
- Candidate notes, portfolio information, and structured professional experience are outside the current MVP scope.

## Hiring process

The Kanban board uses six stages:

1. Applied
2. Screening
3. Interview
4. Offer
5. Hired
6. Rejected

New applications start in the `Applied` stage.

Customer users and administrators can move candidates between stages through the Kanban board.

## Filtering and search

The hiring process can be filtered by:

- Job
- Candidate name

Job filtering is based on jobs represented in the current candidate/application workflow.

## Administration

- Administrators have a dedicated administration area.
- Administrators can create, view, edit, and delete customer and administrator accounts.
- Administrators cannot delete their own administrator account.
- Administrators can enter a customer's ATS and use the existing Jobs, Candidates, and Hiring Process workflows.
- Customer ATS functionality is reused for administrators rather than duplicated.

## Authentication and authorization

- Authentication is handled by Supabase Auth.
- Application users must authenticate before accessing protected ATS routes.
- Customer users cannot access the administrator area.
- Row Level Security (RLS) is used to enforce customer data isolation at the database level.
- Trusted administrative operations use server-side Supabase credentials.

## MVP scope

The MVP prioritizes a complete recruitment workflow over advanced ATS functionality.

The core scope includes:

- Authentication
- Customer and administrator roles
- Account administration
- Job creation and viewing
- Candidate creation and viewing
- Candidate-to-job association
- Kanban-based hiring workflow
- Candidate movement between hiring stages
- Job filtering
- Candidate search
- Customer data isolation
- Administrator access to customer ATS data
- Protected application routes
- Production deployment

Advanced functionality such as job and candidate editing/deletion, candidate notes, portfolio management, structured work experience, CV parsing, email automation, interview scheduling, analytics, password-management workflows, and advanced permissions is outside the core MVP.

AI-assisted CV assessment is treated as an optional extension after completion of the core MVP.