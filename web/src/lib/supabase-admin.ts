import "server-only";

import { createClient } from "@supabase/supabase-js";

// ============================================================
// SUPABASE ADMIN CLIENT
// ============================================================
//
// This client is used only for privileged server-side operations.
//
// Examples:
// - Creating Supabase Auth users
// - Administrative account management
//
// IMPORTANT:
// This file must never be imported into a Client Component.
// The secret key must never be exposed to the browser.
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================================
//
// Fail immediately if the required server environment variables
// are missing. This avoids confusing runtime errors later.
// ============================================================

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL environment variable."
  );
}

if (!supabaseSecretKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY environment variable."
  );
}

// ============================================================
// ADMIN CLIENT
// ============================================================
//
// This client has privileged access to Supabase.
//
// persistSession is disabled because this client runs on the
// server and does not represent a logged-in browser session.
//
// autoRefreshToken is also unnecessary for this server-side
// administrative client.
// ============================================================

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);