"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Imports the Supabase client that we configured in src/lib/supabase.ts.
import { supabase } from "@/lib/supabase";

// Session is the Supabase type that represents an authenticated user session.
import type { Session } from "@supabase/supabase-js";

export default function Home() {
  // Allows this page to navigate to another route.
  const router = useRouter();

  // Stores the current authenticated Supabase session.
  // If there is no logged-in user, the value is null.
  const [session, setSession] = useState<Session | null>(null);

  // Keeps track of whether Supabase is still checking
  // if the user already has an authenticated session.
  const [loading, setLoading] = useState(true);

  // Checks whether Supabase already has an authenticated user
  // when the application loads.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      // If there is no authenticated session,
      // send the user to the login page.
      if (!data.session) {
        router.replace("/login");
        return;
      }

      // If a session exists, save it in the page state.
      setSession(data.session);
      setLoading(false);
    });
  }, [router]);

  // Signs out the currently authenticated user.
  async function handleLogout() {
    await supabase.auth.signOut();

    // After logout, send the user back to the login page.
    router.replace("/login");
  }

  // While Supabase checks the existing session,
  // show a simple loading state.
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-sm text-zinc-600">Loading...</p>
      </main>
    );
  }

  // At this point a valid session exists,
  // so show the authenticated view.
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
          {session?.user.email}
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