"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Defines the job data needed to populate the job selector.
type Job = {
  id: string;
  title: string;
};

export default function NewCandidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // When an administrator is managing a customer, the customer ID
  // is passed through the URL.
  const selectedCustomerId = searchParams.get("customerId");

  // Stores the customer whose ATS data is currently being managed.
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Stores the jobs available to the active customer.
  const [jobs, setJobs] = useState<Job[]>([]);

  // Controls the initial loading state while authentication,
  // customer context and jobs are resolved.
  const [loading, setLoading] = useState(true);

  // Form fields.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [jobId, setJobId] = useState("");

  // Controls the form submission state and possible errors.
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUserData() {
      setLoading(true);
      setError("");

      // Check whether the user has an active Supabase session.
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      // --------------------------------------------------------
      // DETERMINE ACTIVE CUSTOMER
      // --------------------------------------------------------
      //
      // Admin:
      // Use customerId from the URL.
      //
      // Customer:
      // Use customer_id from the authenticated user's profile.
      // --------------------------------------------------------

      let activeCustomerId = selectedCustomerId;

      if (!activeCustomerId) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("customer_id")
          .eq("id", sessionData.session.user.id)
          .single();

        if (profileError) {
          console.error("Error loading profile:", profileError);
          setError(profileError.message);
          setLoading(false);
          return;
        }

        if (!profile.customer_id) {
          setError("No customer is associated with this user.");
          setLoading(false);
          return;
        }

        activeCustomerId = profile.customer_id;
      }

      setCustomerId(activeCustomerId);

      // --------------------------------------------------------
      // LOAD JOBS FOR ACTIVE CUSTOMER
      // --------------------------------------------------------
      //
      // This ensures that an administrator managing Maria, for
      // example, can only select jobs belonging to Maria.
      // --------------------------------------------------------

      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("customer_id", activeCustomerId)
        .order("created_at", { ascending: false });

      if (jobsError) {
        console.error("Error loading jobs:", jobsError);
        setError(jobsError.message);
        setLoading(false);
        return;
      }

      setJobs(jobsData ?? []);
      setLoading(false);
    }

    loadUserData();
  }, [router, selectedCustomerId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!customerId) {
      setError("No customer is associated with this user.");
      return;
    }

    if (!jobId) {
      setError("Please select a job.");
      return;
    }

    setSubmitting(true);
    setError("");

    // --------------------------------------------------------
    // CREATE CANDIDATE
    // --------------------------------------------------------
    //
    // The candidate is explicitly associated with the active
    // customer. For an admin, this is the customer selected
    // through the admin workflow.
    // --------------------------------------------------------

    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .insert({
        customer_id: customerId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
      })
      .select("id")
      .single();

    if (candidateError) {
      console.error("Error creating candidate:", candidateError);
      setError(candidateError.message);
      setSubmitting(false);
      return;
    }

    // --------------------------------------------------------
    // CREATE APPLICATION
    // --------------------------------------------------------
    //
    // Connect the new candidate to the selected job.
    // The database assigns the initial application stage.
    // --------------------------------------------------------

    const { error: applicationError } = await supabase
      .from("applications")
      .insert({
        job_id: jobId,
        candidate_id: candidate.id,
      });

    if (applicationError) {
      console.error("Error creating application:", applicationError);
      setError(applicationError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);

    // --------------------------------------------------------
    // RETURN TO CANDIDATES
    // --------------------------------------------------------
    //
    // Preserve customerId when the administrator is managing
    // another customer's ATS.
    // --------------------------------------------------------

    if (selectedCustomerId) {
      router.push(
        `/candidates?customerId=${encodeURIComponent(selectedCustomerId)}`
      );
      return;
    }

    router.push("/candidates");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-zinc-900">
          Add candidate
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Add a candidate to a job position
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="firstName"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              First name
            </label>

            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
              placeholder="John"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Last name
            </label>

            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
              placeholder="Doe"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Phone
            </label>

            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
              placeholder="+46 000 000 000"
            />
          </div>

          <div>
            <label
              htmlFor="linkedinUrl"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              LinkedIn URL
            </label>

            <input
              id="linkedinUrl"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
              placeholder="https://www.linkedin.com/in/johndoe"
            />
          </div>

          <div>
            <label
              htmlFor="jobId"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Job
            </label>

            <select
              id="jobId"
              required
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
            >
              <option value="">Select a job</option>

              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {jobs.length === 0 && !error && (
            <p className="text-sm text-amber-700">
              This customer does not have any jobs yet.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || jobs.length === 0}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Adding candidate..." : "Add candidate"}
          </button>
        </form>
      </div>
    </main>
  );
}