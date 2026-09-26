"use client";

// ============================================================
// CANDIDATES PAGE
// ============================================================
// This page displays the candidates that belong to the
// currently logged-in customer's jobs.
//
// Data relationship:
//
// candidates -> applications -> jobs
//
// We start from "applications" because it connects a candidate
// with a job and also contains the candidate's pipeline stage.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";


// ============================================================
// TYPES
// ============================================================

// Shape of the candidate data that we will use in the UI.
//
// phone and linkedin_url can be null because these fields
// may not exist for every candidate.
type Candidate = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  stage: string;
  job_title: string;
};


// ============================================================
// PAGE COMPONENT
// ============================================================

export default function CandidatesPage() {
  // Stores the candidates returned from Supabase.
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Controls the loading message while data is being fetched.
  const [loading, setLoading] = useState(true);

  // Stores an error message if the request fails.
  const [error, setError] = useState("");


  // ==========================================================
  // LOAD CANDIDATES
  // ==========================================================
  // Runs once when the page loads.
  //
  // Instead of querying only the candidates table, we query
  // applications because an application connects:
  //
  // candidate -> application -> job
  //
  // It also gives us the pipeline stage such as "applied".
  // ==========================================================

  useEffect(() => {
    async function loadCandidates() {
      // Start loading and clear any previous error.
      setLoading(true);
      setError("");

      // --------------------------------------------------------
      // Query Supabase
      // --------------------------------------------------------
      // We retrieve:
      //
      // applications.stage
      //
      // candidates:
      // - id
      // - first_name
      // - last_name
      // - email
      // - phone
      // - linkedin_url
      //
      // jobs:
      // - title
      //
      // Supabase uses the foreign-key relationships between
      // these tables to return the related records.
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
          jobs (
            title
          )
        `)
        .order("created_at", { ascending: false });


      // --------------------------------------------------------
      // Handle query errors
      // --------------------------------------------------------

      if (queryError) {
        console.error("Error loading candidates:", queryError);

        setError(queryError.message);
        setLoading(false);

        return;
      }


      // --------------------------------------------------------
      // Transform Supabase data
      // --------------------------------------------------------
      // Supabase returns nested objects because candidates and
      // jobs are related to applications.
      //
      // We convert that nested structure into a simpler object
      // that is easier to render in React.
      // --------------------------------------------------------

      const formattedCandidates: Candidate[] = (data ?? [])
        // Ignore incomplete applications that do not have
        // a related candidate or job.
        .filter(
          (application) =>
            application.candidates !== null &&
            application.jobs !== null
        )

        // Convert the nested Supabase result into our
        // Candidate structure.
        .map((application) => ({
          id: application.candidates!.id,
          first_name: application.candidates!.first_name,
          last_name: application.candidates!.last_name,
          email: application.candidates!.email,
          phone: application.candidates!.phone,
          linkedin_url: application.candidates!.linkedin_url,
          stage: application.stage,
          job_title: application.jobs!.title,
        }));


      // Save the candidates in React state.
      setCandidates(formattedCandidates);

      // Data loading has finished.
      setLoading(false);
    }

    loadCandidates();
  }, []);


  // ==========================================================
  // PAGE UI
  // ==========================================================

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


          {/* Link to the Add Candidate page */}
          <Link
            href="/candidates/new"
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
            ====================================================
            Displayed when the query works but there are no
            candidates yet.
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
                key={candidate.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                }}
              >

                {/* Candidate full name */}
                <h2
                  style={{
                    margin: "0 0 8px",
                    fontSize: "18px",
                  }}
                >
                  {candidate.first_name} {candidate.last_name}
                </h2>


                {/* Candidate email */}
                <p
                  style={{
                    margin: "0 0 6px",
                    color: "#4b5563",
                    fontSize: "14px",
                  }}
                >
                  {candidate.email}
                </p>


                {/* Candidate phone
                    Only displayed if a phone number exists. */}
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


                {/* LinkedIn profile
                    Only displayed if the candidate has a
                    LinkedIn URL.

                    target="_blank" opens LinkedIn in a new tab.

                    rel="noopener noreferrer" is recommended
                    when opening external websites. */}
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


                {/* Job and pipeline stage badges */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >

                  {/* Job title */}
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


                  {/* Candidate pipeline stage */}
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