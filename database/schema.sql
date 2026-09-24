-- Mini ATS database schema
-- Defines the PostgreSQL tables used by the application.


-- ============================================================
-- CUSTOMERS
-- Stores the companies/organizations that use the ATS.
-- Jobs, candidates and customer users will belong to a customer.
-- ============================================================

CREATE TABLE customers (
    -- Unique identifier generated automatically by PostgreSQL.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Display name of the company/customer.
    name TEXT NOT NULL,

    -- Timestamp recording when the customer was created.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- PROFILES
-- Stores application-specific information about authenticated users.
-- Authentication itself (email, password, login) is handled by
-- Supabase Auth in the auth.users table.
-- ============================================================

CREATE TABLE profiles (
    -- Uses the same UUID as the corresponding Supabase Auth user.
    -- If the Auth user is deleted, its profile is also deleted.
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Name displayed inside the ATS.
    full_name TEXT NOT NULL,

    -- Determines what the user can do in the application.
    -- MVP roles are either 'admin' or 'customer'.
    role TEXT NOT NULL CHECK (role IN ('admin', 'customer')),

    -- Links customer users to the company they belong to.
    -- Admin users may have this value as NULL.
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

    -- Timestamp recording when the profile was created.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- JOBS
-- Stores the job positions created by customers.
-- Each job belongs to one customer.
-- ============================================================

CREATE TABLE jobs (
    -- Unique identifier generated automatically by PostgreSQL.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Customer/company that owns this job.
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Job title shown in the ATS.
    title TEXT NOT NULL,

    -- Optional description of the job.
    description TEXT,

    -- Timestamp recording when the job was created.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CANDIDATES
-- Stores the candidates managed by each customer.
-- Each candidate belongs to one customer.
-- ============================================================

CREATE TABLE candidates (
    -- Unique identifier generated automatically by PostgreSQL.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Customer/company that owns this candidate.
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Candidate's basic profile information.
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,

    -- Optional LinkedIn profile URL.
    linkedin_url TEXT,

    -- Timestamp recording when the candidate was created.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPLICATIONS
-- Connects candidates to jobs.
-- Stores the candidate's current stage in the hiring process.
-- ============================================================

CREATE TABLE applications (
    -- Unique identifier generated automatically by PostgreSQL.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Job the candidate is applying for.
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

    -- Candidate applying for the job.
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

    -- Current stage displayed on the Kanban board.
    stage TEXT NOT NULL DEFAULT 'applied'
        CHECK (stage IN (
            'applied',
            'screening',
            'interview',
            'offer',
            'hired',
            'rejected'
        )),

    -- Timestamp recording when the application was created.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevents the same candidate from being added twice
    -- to the same job.
    UNIQUE (job_id, candidate_id)
);