"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Imports the Supabase client that we configured in src/lib/supabase.ts.
import { supabase } from "@/lib/supabase";

// Defines the application roles currently supported by the MVP.
type UserRole = "admin" | "customer";

export default function Home() {
  // Allows this page to navigate to another route.
  const router = useRouter();

  // Stores an error if the authenticated user's profile
  // cannot be loaded or does not contain a valid role.
  const [error, setError] = useState("");

  // Checks the authenticated session and redirects the user
  // to the correct application area based on their profile role.
  useEffect(() => {
    async function redirectAuthenticatedUser() {
      setError("");

      // Check whether Supabase already has an authenticated session.
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      // If Supabase cannot resolve the session, expose the error.
      if (sessionError) {
        console.error("Error loading session:", sessionError);
        setError(sessionError.message);
        return;
      }

      // If there is no authenticated session,
      // send the user to the login page.
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      // Load the application profile associated with
      // the authenticated Supabase user.
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", sessionData.session.user.id)
          .single();

      // Stop if the application profile cannot be loaded.
      if (profileError) {
        console.error("Error loading profile:", profileError);
        setError(profileError.message);
        return;
      }

      // Validate the role before using it for navigation.
      const role = profile.role as UserRole;

      // Admin users enter through the admin dashboard.
      if (role === "admin") {
        router.replace("/admin");
        return;
      }

      // Customer users enter directly into their ATS workflow.
      if (role === "customer") {
        router.replace("/jobs");
        return;
      }

      // This should not normally happen because the database
      // restricts profiles to admin and customer roles.
      setError("This user does not have a valid application role.");
    }

    redirectAuthenticatedUser();
  }, [router]);

  // The home route acts only as an authenticated entry point.
  // While the session and profile are being resolved,
  // show a temporary loading state.
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm font-medium text-red-600">
              {error}
            </p>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/login");
              }}
              className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Return to login
            </button>
          </>
        ) : (
          <p className="text-sm text-zinc-600">
            Loading Mini ATS...
          </p>
        )}
      </div>
    </main>
  );
}