"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Defines the structure of a job returned from the database.
type Job = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export default function JobsPage() {
  const router = useRouter();

  // Stores the jobs loaded from Supabase and the UI request state.
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadJobs() {
      // Check that the user has an active session before loading protected data.
      const { data: sessionData } = await supabase.auth.getSession();

      // Redirect unauthenticated users to the login page.
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      // Load the available jobs, showing the most recently created ones first.
      // Row Level Security (RLS) determines which jobs the current user can access.
      const { data, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, description, created_at")
        .order("created_at", { ascending: false });

      // Stop the loading process and expose database errors to the UI.
      if (jobsError) {
        console.error("Error loading jobs:", jobsError);
        setError(jobsError.message);
        setLoading(false);
        return;
      }

      // Store the retrieved jobs, using an empty array when no records are returned.
      setJobs(data ?? []);
      setLoading(false);
    }

    // Load jobs when the page is initialized.
    loadJobs();
  }, [router]);

  // Display a temporary loading state while authentication and data are resolved.
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading jobs...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              Jobs
            </h1>

            <p className="mt-2 text-zinc-600">
              View your job positions
            </p>
          </div>

          {/* Provides navigation to the job creation workflow. */}
          <Link
            href="/jobs/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700"
          >
            Create job
          </Link>
        </div>

        {/* Display an error message if the jobs query fails. */}
        {error && (
          <p className="mt-6 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-8 space-y-4">
          {/* Handle the empty state separately from the jobs list. */}
          {jobs.length === 0 ? (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-zinc-600">
                No jobs found.
              </p>
            </div>
          ) : (
            // Render one card for each job returned by Supabase.
            jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <h2 className="text-xl font-semibold text-zinc-900">
                  {job.title}
                </h2>

                <p className="mt-2 text-zinc-600">
                  {job.description || "No description"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}