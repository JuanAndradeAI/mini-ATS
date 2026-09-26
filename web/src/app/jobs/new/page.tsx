"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export default function NewJobPage() {
  const router = useRouter();

// Stores the authenticated session and the customer associated with the user.
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);

// Stores the form values and submission state.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUserData() {
// Check that the user has an active session before allowing access.
    const { data: sessionData } = await supabase.auth.getSession();

// Redirect unauthenticated users to the login page.
    if (!sessionData.session) {
      router.replace("/login");
      return;
    }

    setSession(sessionData.session);

// Load the authenticated user's profile to determine which customer
// the new job should belong to.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", sessionData.session.user.id)
      .single();

    // Stop the initialization process if the profile cannot be loaded.
    if (profileError) {
        console.error("Profile error details:", {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
        userId: sessionData.session.user.id,
    });

    setLoading(false);
    return;
}

    // Store the customer ID so new jobs can be associated with the correct tenant.
    setCustomerId(profile.customer_id);
    setLoading(false);
  }

  // Load authentication and customer information when the page is initialized.
  loadUserData();
}, [router]);

// Handles validation and persistence when the job creation form is submitted.
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  // Prevent creating a job without an associated customer.
  if (!customerId) {
    setError("No customer is associated with this user.");
    return;
  }

  setSubmitting(true);
  setError("");

// Create the job under the current customer's account.
// Row Level Security (RLS) provides the database-level authorization check.
const { error: insertError } = await supabase
  .from("jobs")
  .insert({
  customer_id: customerId,
  title: title.trim(),
  description: description.trim() || null,
    });

// Keep the form data available and display the database error if creation fails.
if (insertError) {
  console.error("Error creating job:", insertError);
  setError(insertError.message);
  setSubmitting(false);
  return;
  }

  // Reset the form after the job has been successfully created.
  setTitle("");
  setDescription("");
  setSubmitting(false);

  alert("Job created successfully");
}

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-zinc-900">
          Create job
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Add a new job position
        </p>

        {/* Submit the controlled form through the job creation handler. */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Job title
            </label>

            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
              placeholder="Software Engineer"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Description
            </label>

            <textarea
              id="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
              placeholder="Describe the position..."
            />
          </div>

          {/* Display any validation or database error returned during creation. */}
          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Disable repeated submissions while the insert request is in progress. */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create job"}
          </button>
        </form>
      </div>
    </main>
  );
}