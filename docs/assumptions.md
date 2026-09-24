# Mini ATS — Assumptions

To keep the first version simple and deliverable within the challenge timeframe,
the following assumptions are used for the MVP.

## Customers and users

- A customer represents one company or organization.
- A customer can have one or more user accounts.
- Customer users can only access data belonging to their own customer.
- Admin users can access and manage data for all customers.
- User accounts are created by an admin. Public sign-up is not required.

## Jobs

- A job belongs to one customer.
- A job contains a title and an optional description.
- Customers can create and view their own jobs.

## Candidates

- A candidate belongs to one customer.
- For the MVP, a candidate is associated with one job.
- Candidate profile information includes:
  - Name
  - Email
  - LinkedIn URL
  - Notes
  - Pipeline stage

## Candidate pipeline

The Kanban board uses four stages:

1. Applied
2. Interview
3. Offer
4. Hired

Candidates can move between these stages.

## Filtering

The Kanban board can be filtered by:

- Job
- Candidate name

## MVP scope

The first version prioritizes the complete recruitment workflow over advanced ATS functionality.

Features such as CV parsing, email automation, interview scheduling, analytics,
multiple job applications per candidate and advanced permissions are outside the
core MVP.

AI-assisted CV assessment is treated as an optional extension after the core
workflow is functional.