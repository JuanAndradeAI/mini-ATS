// Imports the function used to create a Supabase client.
// This client allows the application to communicate with
// Supabase services such as Authentication and PostgreSQL.

import { createClient } from "@supabase/supabase-js";

// Reads the Supabase project URL from the environment variables.
// The "!" tells TypeScript that we expect this value to exist.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Reads the public Supabase key from the environment variables.
// This key can be used by the frontend because database access
// is protected by Supabase Authentication and Row Level Security.

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  // Creates one Supabase client that can be reused throughout the application.
// For example:
// - supabase.auth -> authentication and login
// - supabase.from("jobs") -> access the jobs table
// - supabase.from("candidates") -> access the candidates table

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);