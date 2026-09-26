-- Mini ATS Row Level Security policies
-- Controls which data authenticated users are allowed to access.
--
-- Security model:
-- 1. Admin users can access data across all customers.
-- 2. Customer users can only access data belonging to their own customer.
-- 3. Supabase Auth identifies the logged-in user.
-- 4. The profiles table tells us the user's role and customer.


-- ============================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- Turns on row-level protection for all application tables.
-- ============================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE PRIVILEGES
-- Allows authenticated users to access application tables.
-- RLS policies below still determine which rows they can access.
-- ============================================================

GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.candidates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.applications TO authenticated;

-- ============================================================
-- SERVICE ROLE PRIVILEGES
-- Allows trusted server-side administrative operations.
--
-- The service role key is only used by the server-side
-- Supabase admin client and must never be exposed to the browser.
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.customers
TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.profiles
TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.jobs
TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.candidates
TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.applications
TO service_role;

-- ============================================================
-- 2. SECURITY HELPER FUNCTIONS
-- Small reusable functions used by the security policies.
-- ============================================================

-- Checks whether the currently logged-in user is an admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
$$;


-- Returns the customer ID of the currently logged-in user.
-- For an admin this will normally return NULL because admins
-- do not belong to one specific customer.
CREATE OR REPLACE FUNCTION public.current_customer_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT customer_id
    FROM public.profiles
    WHERE id = auth.uid();
$$;


-- ============================================================
-- 3. PROFILES POLICIES
-- Controls who can read user profiles.
-- ============================================================

-- Every authenticated user can read their own profile.
CREATE POLICY "Users can read their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
);


-- Admins can read all profiles.
CREATE POLICY "Admins can read all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
    public.is_admin()
);


-- ============================================================
-- 4. CUSTOMERS POLICIES
-- Controls who can read customer/company information.
-- ============================================================

-- Admins can read every customer.
CREATE POLICY "Admins can read all customers"
ON customers
FOR SELECT
TO authenticated
USING (
    public.is_admin()
);


-- Customer users can only read the company they belong to.
CREATE POLICY "Customers can read their own customer"
ON customers
FOR SELECT
TO authenticated
USING (
    id = public.current_customer_id()
);

-- ============================================================
-- 5. JOBS POLICIES
-- Controls who can read job information.
-- ============================================================

-- Admins can read jobs from every customer.
CREATE POLICY "Admins can read all jobs"
ON jobs
FOR SELECT
TO authenticated
USING (
    public.is_admin()
);


-- Customer users can only read jobs that belong to their company.
CREATE POLICY "Customers can read their own jobs"
ON jobs
FOR SELECT
TO authenticated
USING (
    customer_id = public.current_customer_id()
);

-- ============================================================
-- 6. CANDIDATES POLICIES
-- Controls who can read candidate information.
-- ============================================================

-- Admins can read candidates from every customer.
CREATE POLICY "Admins can read all candidates"
ON candidates
FOR SELECT
TO authenticated
USING (
    public.is_admin()
);


-- Customer users can only read candidates that belong to their company.
CREATE POLICY "Customers can read their own candidates"
ON candidates
FOR SELECT
TO authenticated
USING (
    customer_id = public.current_customer_id()
);

-- ============================================================
-- 7. APPLICATIONS POLICIES
-- Controls who can read job applications.
-- ============================================================

-- Admins can read applications from every customer.
CREATE POLICY "Admins can read all applications"
ON applications
FOR SELECT
TO authenticated
USING (
    public.is_admin()
);


-- Customer users can only read applications for jobs
-- that belong to their company.
CREATE POLICY "Customers can read their own applications"
ON applications
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM jobs
        WHERE jobs.id = applications.job_id
          AND jobs.customer_id = public.current_customer_id()
    )
);

-- ============================================================
-- 8. JOBS WRITE POLICIES
-- Controls who can create and update jobs.
-- ============================================================

-- Admins can create jobs for any customer.
CREATE POLICY "Admins can create jobs"
ON jobs
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);


-- Customer users can only create jobs for their own company.
CREATE POLICY "Customers can create their own jobs"
ON jobs
FOR INSERT
TO authenticated
WITH CHECK (
    customer_id = public.current_customer_id()
);


-- Admins can update any job.
CREATE POLICY "Admins can update jobs"
ON jobs
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- Customer users can only update jobs belonging to their company.
CREATE POLICY "Customers can update their own jobs"
ON jobs
FOR UPDATE
TO authenticated
USING (
    customer_id = public.current_customer_id()
)
WITH CHECK (
    customer_id = public.current_customer_id()
);

-- ============================================================
-- 9. CANDIDATES WRITE POLICIES
-- Controls who can create and update candidates.
-- ============================================================

-- Admins can create candidates for any customer.
CREATE POLICY "Admins can create candidates"
ON candidates
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);


-- Customer users can only create candidates for their own company.
CREATE POLICY "Customers can create their own candidates"
ON candidates
FOR INSERT
TO authenticated
WITH CHECK (
    customer_id = public.current_customer_id()
);


-- Admins can update any candidate.
CREATE POLICY "Admins can update candidates"
ON candidates
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- Customer users can only update candidates belonging to their company.
CREATE POLICY "Customers can update their own candidates"
ON candidates
FOR UPDATE
TO authenticated
USING (
    customer_id = public.current_customer_id()
)
WITH CHECK (
    customer_id = public.current_customer_id()
);

-- ============================================================
-- 10. APPLICATIONS WRITE POLICIES
-- Controls who can create and update job applications.
-- ============================================================

-- Admins can create applications for any customer.
CREATE POLICY "Admins can create applications"
ON applications
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);


-- Customer users can create applications only for jobs
-- that belong to their own company.
CREATE POLICY "Customers can create their own applications"
ON applications
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM jobs
        WHERE jobs.id = applications.job_id
          AND jobs.customer_id = public.current_customer_id()
    )
);


-- Admins can update any application.
-- This includes moving candidates between Kanban stages.
CREATE POLICY "Admins can update applications"
ON applications
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- Customer users can update applications only for jobs
-- belonging to their own company.
-- This allows them to move candidates between Kanban stages.
CREATE POLICY "Customers can update their own applications"
ON applications
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM jobs
        WHERE jobs.id = applications.job_id
          AND jobs.customer_id = public.current_customer_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM jobs
        WHERE jobs.id = applications.job_id
          AND jobs.customer_id = public.current_customer_id()
    )
);