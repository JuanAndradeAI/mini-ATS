"use client";

// useState lets this page remember values that change while the user
// interacts with it, such as the email, password, loading state and errors.
import { useEffect, useState } from "react";

// Imports the Supabase client that we configured in src/lib/supabase.ts.
import { supabase } from "@/lib/supabase";

// Session is the Supabase type that represents an authenticated user session.
import type { Session } from "@supabase/supabase-js";

export default function Home() {
  // Stores what the user types in the email field.
  const [email, setEmail] = useState("");

  // Stores what the user types in the password field.
  const [password, setPassword] = useState("");

  // Stores an error message if the login fails.
  const [error, setError] = useState("");

  // Keeps track of whether a login request is currently running.
  const [loading, setLoading] = useState(false);

  // Stores the current authenticated Supabase session.
  // If there is no logged-in user, the value is null.
  const [session, setSession] = useState<Session | null>(null);

  // Checks whether Supabase already has an authenticated user
  // when the application loads.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  // Runs when the user submits the login form.
  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    // Prevents the browser from refreshing the page when the form is submitted.
    event.preventDefault();

    // Clears any previous error and marks the login request as running.
    setError("");
    setLoading(true);

  
  // Sends the credentials to Supabase and receives the session
  // created when the login is successful.
  const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If Supabase rejects the login, show the error to the user.
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    // Saves the authenticated session returned by Supabase.
    setSession(data.session);

    setLoading(false);
  }

    // Signs out the currently authenticated user.
    async function handleLogout() {
      await supabase.auth.signOut();

      // Clears the session stored in the page.
      setSession(null);
    }

// If there is an authenticated session, show the logged-in view
// instead of showing the login form again.
if (session) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-md">
        <h1 className="text-3xl font-bold text-zinc-900">
          Mini ATS
        </h1>

        <p className="mt-4 text-sm text-zinc-600">
          You are signed in as
        </p>

        <p className="mt-1 font-medium text-zinc-900">
          {session.user.email}
        </p>
        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700"
        >
          Log out
        </button>
      </div>
    </main>
  );
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