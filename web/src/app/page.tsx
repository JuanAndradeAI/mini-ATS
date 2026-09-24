"use client";

// useState lets this page remember values that change while the user
// interacts with it, such as the email, password, loading state and errors.
import { useState } from "react";

// Imports the Supabase client that we configured in src/lib/supabase.ts.
import { supabase } from "@/lib/supabase";

export default function Home() {
  // Stores what the user types in the email field.
  const [email, setEmail] = useState("");

  // Stores what the user types in the password field.
  const [password, setPassword] = useState("");

  // Stores an error message if the login fails.
  const [error, setError] = useState("");

  // Keeps track of whether a login request is currently running.
  const [loading, setLoading] = useState(false);

  // Runs when the user submits the login form.
  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    // Prevents the browser from refreshing the page when the form is submitted.
    event.preventDefault();

    // Clears any previous error and marks the login request as running.
    setError("");
    setLoading(true);

    // Sends the email and password to Supabase Authentication.
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If Supabase rejects the login, show the error to the user.
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    // For now, confirm that authentication worked.
    // Later this will redirect the user to the ATS dashboard.
    alert("Login successful!");

    setLoading(false);
  }

  return (
    // Centers the login card on the page.
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        {/* Application title and short description. */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-zinc-900">Mini ATS</h1>

          <p className="mt-2 text-sm text-zinc-600">
            Sign in to manage jobs and candidates
          </p>
        </div>

        {/* Submitting this form calls handleLogin(). */}
        <form onSubmit={handleLogin} className="space-y-5">
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
              // Saves every change made in the input into the email state.
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              // Saves every change made in the input into the password state.
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
              placeholder="Enter your password"
            />
          </div>

          {/* Only appears when Supabase returns a login error. */}
          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {/* Changes the button text while Supabase is processing the login. */}
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>
      </div>
    </main>
  );
}