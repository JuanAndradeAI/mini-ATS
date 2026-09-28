"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AtsNavigation from "@/components/AtsNavigation";

// ============================================================
// CANDIDATES PAGE
// ============================================================
//
// This page supports two contexts:
//
// 1. Customer:
//    The authenticated customer sees their own candidates.
//
// 2. Administrator:
//    The administrator can manage a selected customer's
//    candidates using ?customerId=...
//
// Data relationship:
//
// candidates -> applications -> jobs
//
// We query applications because it connects the candidate
// with the job and contains the pipeline stage.
// ============================================================

type Candidate = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  stage: string;
  job_title: string;
};

type ApplicationRow = {
  stage: string;
  candidates:
    | {
        id: string;
        first_name: string;
        last_name: string;
        email: string | null;
        phone: string | null;
        linkedin_url: string | null;
      }
    | {
        id: string;
        first_name: string;
        last_name: string;
        email: string | null;
        phone: string | null;
        linkedin_url: string | null;
      }[]
    | null;
  jobs:
    | {
        title: string;
        customer_id: string;
      }
    | {
        title: string;
        customer_id: string;
      }[]
    | null;
};

// ============================================================
// PAGE WRAPPER
// ============================================================
//
// useSearchParams() must be rendered inside a Suspense boundary
// so that Next.js can build and prerender this route correctly.
//
// The actual candidate management logic remains inside
// CandidatesContent.
// ============================================================

export default function CandidatesPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            background: "#f3f4f6",
            padding: "40px 20px",
          }}
        >
          <div
            style={{
              maxWidth: "760px",
              margin: "0 auto",
            }}
          >
            <p
              style={{
                color: "#4b5563",
              }}
            >
              Loading candidates...
            </p>
          </div>
        </main>
      }
    >
      <CandidatesContent />
    </Suspense>
  );
}

// ============================================================
// CANDIDATES CONTENT
// ============================================================
//
// This component contains the actual page logic.
//
// Keeping useSearchParams() here ensures that it is rendered
// inside the Suspense boundary defined above.
// ============================================================

function CandidatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Customer selected by an administrator.
  const selectedCustomerId = searchParams.get("customerId");

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCandidates() {
      setLoading(true);
      setError("");

      // --------------------------------------------------------
      // AUTHENTICATION
      // --------------------------------------------------------

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      // --------------------------------------------------------
      // DETERMINE WHICH CUSTOMER WE ARE MANAGING
      // --------------------------------------------------------
      //
      // Admin:
      // customerId comes from the URL.
      //
      // Customer:
      // customerId comes from their profile.
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

      // --------------------------------------------------------
      // LOAD APPLICATIONS
      // --------------------------------------------------------
      //
      // We retrieve:
      //
      // - application stage
      // - candidate information
      // - job title
      // - job customer_id
      //
      // The jobs.customer_id filter ensures that only candidates
      // belonging to the selected customer are displayed.
      // --------------------------------------------------------

      const { data, error: queryError } = await supabase
        .from("applications")
        .select(`
          stage,
          candidates (
            id,
            first_name,
            last_name,
            email,
            phone,
            linkedin_url
          ),
          jobs!inner (
            title,
            customer_id
          )
        `)
        .eq("jobs.customer_id", activeCustomerId)
        .order("created_at", { ascending: false });

      if (queryError) {
        console.error("Error loading candidates:", queryError);
        setError(queryError.message);
        setLoading(false);
        return;
      }

      // --------------------------------------------------------
      // TRANSFORM SUPABASE DATA
      // --------------------------------------------------------

      const formattedCandidates: Candidate[] = (
        (data ?? []) as ApplicationRow[]
      ).flatMap((application) => {
        const candidate = Array.isArray(application.candidates)
          ? application.candidates[0]
          : application.candidates;

        const job = Array.isArray(application.jobs)
          ? application.jobs[0]
          : application.jobs;

        if (!candidate || !job) {
          return [];
        }

        return [
          {
            id: candidate.id,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            email: candidate.email,
            phone: candidate.phone,
            linkedin_url: candidate.linkedin_url,
            stage: application.stage,
            job_title: job.title,
          },
        ];
      });

      setCandidates(formattedCandidates);
      setLoading(false);
    }

    loadCandidates();
  }, [router, selectedCustomerId]);

  // Preserve customerId when an administrator creates a candidate.
  const addCandidateHref = selectedCustomerId
    ? `/candidates/new?customerId=${encodeURIComponent(selectedCustomerId)}`
    : "/candidates/new";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        <AtsNavigation />

        {/* ====================================================
            PAGE HEADER
            ==================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 8px",
                fontSize: "28px",
                fontWeight: 700,
              }}
            >
              Candidates
            </h1>

            <p
              style={{
                margin: 0,
                color: "#4b5563",
              }}
            >
              View your candidates
            </p>
          </div>

          <Link
            href={addCandidateHref}
            style={{
              background: "#18181b",
              color: "#ffffff",
              padding: "10px 16px",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "14px",
              whiteSpace: "nowrap",
            }}
          >
            Add candidate
          </Link>
        </div>

        {/* ====================================================
            LOADING STATE
            ==================================================== */}

        {loading && (
          <p
            style={{
              color: "#4b5563",
            }}
          >
            Loading candidates...
          </p>
        )}

        {/* ====================================================
            ERROR STATE
            ==================================================== */}

        {!loading && error && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "16px",
              color: "#dc2626",
            }}
          >
            {error}
          </div>
        )}

        {/* ====================================================
            EMPTY STATE
            ==================================================== */}

        {!loading && !error && candidates.length === 0 && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              padding: "24px",
              border: "1px solid #e5e7eb",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#4b5563",
              }}
            >
              No candidates found.
            </p>
          </div>
        )}

        {/* ====================================================
            CANDIDATES LIST
            ==================================================== */}

        {!loading && !error && candidates.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {candidates.map((candidate) => (
              <div
                key={`${candidate.id}-${candidate.job_title}`}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 8px",
                    fontSize: "18px",
                  }}
                >
                  {candidate.first_name} {candidate.last_name}
                </h2>

                {candidate.email && (
                  <p
                    style={{
                      margin: "0 0 6px",
                      color: "#4b5563",
                      fontSize: "14px",
                    }}
                  >
                    {candidate.email}
                  </p>
                )}

                {candidate.phone && (
                  <p
                    style={{
                      margin: "0 0 6px",
                      color: "#4b5563",
                      fontSize: "14px",
                    }}
                  >
                    {candidate.phone}
                  </p>
                )}

                {candidate.linkedin_url && (
                  <a
                    href={candidate.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginBottom: "14px",
                      color: "#2563eb",
                      fontSize: "14px",
                      textDecoration: "none",
                    }}
                  >
                    LinkedIn profile
                  </a>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background: "#e5e7eb",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    {candidate.job_title}
                  </span>

                  <span
                    style={{
                      background: "#e5e7eb",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      textTransform: "capitalize",
                    }}
                  >
                    {candidate.stage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}