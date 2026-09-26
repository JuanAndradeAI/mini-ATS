"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ============================================================
// TYPES
// ============================================================

type Stage =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

type KanbanApplication = {
  application_id: string;
  candidate_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  job_title: string;
  stage: Stage;
  created_at: string;
};

type KanbanColumn = {
  id: Stage;
  title: string;
};

type CandidateRelation = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
};

type JobRelation = {
  title: string;
};

type SupabaseApplicationRow = {
  id: string;
  stage: string;
  created_at: string;
  candidates: CandidateRelation | CandidateRelation[] | null;
  jobs: JobRelation | JobRelation[] | null;
};

// ============================================================
// KANBAN COLUMNS
// ============================================================

const kanbanColumns: KanbanColumn[] = [
  {
    id: "applied",
    title: "Applied",
  },
  {
    id: "screening",
    title: "Screening",
  },
  {
    id: "interview",
    title: "Interview",
  },
  {
    id: "offer",
    title: "Offer",
  },
  {
    id: "hired",
    title: "Hired",
  },
  {
    id: "rejected",
    title: "Rejected",
  },
];

// ============================================================
// HELPERS
// ============================================================

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

// ============================================================
// PAGE
// ============================================================

export default function KanbanPage() {
  const router = useRouter();

  const [applications, setApplications] = useState<KanbanApplication[]>([]);

  const [selectedApplication, setSelectedApplication] =
    useState<KanbanApplication | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [updatingStage, setUpdatingStage] = useState(false);

  const [stageError, setStageError] = useState("");

  // ============================================================
  // JOB FILTER STATE
  // ============================================================
  //
  // "all" means that applications from every job are displayed.
  // Otherwise this value contains the selected job title.
  // ============================================================

  const [selectedJob, setSelectedJob] = useState<string>("all");

  // ============================================================
 // CANDIDATE NAME SEARCH STATE
 // ============================================================
 
 const [candidateSearch, setCandidateSearch] = useState("");

  // ============================================================
  // DRAG & DROP STATE
  // ============================================================

  const [draggedApplicationId, setDraggedApplicationId] =
    useState<string | null>(null);

  const [dragOverStage, setDragOverStage] =
    useState<Stage | null>(null);

  // ============================================================
  // LOAD APPLICATIONS
  // ============================================================

  useEffect(() => {
    async function loadApplications() {
      // --------------------------------------------------------
      // CHECK AUTHENTICATION
      // --------------------------------------------------------

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      setLoading(true);
      setError("");

      // --------------------------------------------------------
      // LOAD APPLICATIONS + CANDIDATE + JOB
      // --------------------------------------------------------

      const { data, error: applicationsError } = await supabase
        .from("applications")
        .select(`
          id,
          stage,
          created_at,
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
      // HANDLE SUPABASE ERROR
      // --------------------------------------------------------

      if (applicationsError) {
        console.error(
          "Error loading Kanban applications:",
          applicationsError
        );

        setError(applicationsError.message);
        setLoading(false);
        return;
      }

      // --------------------------------------------------------
      // NORMALIZE SUPABASE RESPONSE
      // --------------------------------------------------------

      const rows = (data ?? []) as unknown as SupabaseApplicationRow[];

      const formattedApplications: KanbanApplication[] = rows.flatMap(
        (application) => {
          const candidate = Array.isArray(application.candidates)
            ? application.candidates[0]
            : application.candidates;

          const job = Array.isArray(application.jobs)
            ? application.jobs[0]
            : application.jobs;

          if (!candidate || !job) {
            return [];
          }

          const validStages: Stage[] = [
            "applied",
            "screening",
            "interview",
            "offer",
            "hired",
            "rejected",
          ];

          if (!validStages.includes(application.stage as Stage)) {
            return [];
          }

          return [
            {
              application_id: application.id,
              candidate_id: candidate.id,
              first_name: candidate.first_name,
              last_name: candidate.last_name,
              email: candidate.email,
              phone: candidate.phone,
              linkedin_url: candidate.linkedin_url,
              job_title: job.title,
              stage: application.stage as Stage,
              created_at: application.created_at,
            },
          ];
        }
      );

      setApplications(formattedApplications);
      setLoading(false);
    }

    loadApplications();
  }, [router]);

  // ============================================================
  // JOB FILTER
  // ============================================================
  //
  // Build a unique list of job titles from the applications
  // already loaded from Supabase.
  //
  // We use Set so the same job is not displayed more than once
  // in the filter dropdown.
  // ============================================================

  const jobTitles = Array.from(
    new Set(applications.map((application) => application.job_title))
  ).sort((a, b) => a.localeCompare(b));

  // ============================================================
// FILTERED APPLICATIONS
// ============================================================
//
// The original applications state remains untouched.
//
// The Kanban only renders this filtered collection.
//
// We apply TWO independent filters:
//
// 1. Job filter
// 2. Candidate name search
//
// This means filtering does NOT modify Supabase data.
// It only changes which applications are displayed.
//
// ============================================================

const normalizedCandidateSearch = candidateSearch
  .trim()
  .toLowerCase();

const filteredApplications = applications.filter(
  (application) => {
    // --------------------------------------------------------
    // JOB FILTER
    // --------------------------------------------------------
    //
    // If "all" is selected, every job is allowed.
    // Otherwise, the application must belong to the
    // selected job.
    // --------------------------------------------------------

    const matchesJob =
      selectedJob === "all" ||
      application.job_title === selectedJob;

    // --------------------------------------------------------
    // CANDIDATE NAME SEARCH
    // --------------------------------------------------------
    //
    // Combine first name + last name into one searchable
    // string.
    //
    // Example:
    //
    // first_name = "Daniel"
    // last_name  = "Garcia"
    //
    // searchableCandidateName = "daniel garcia"
    //
    // Converting everything to lowercase makes the search
    // case-insensitive.
    // --------------------------------------------------------

    const searchableCandidateName =
      `${application.first_name} ${application.last_name}`.toLowerCase();

    // If the search field is empty, every candidate matches.
    //
    // Otherwise, check whether the candidate's full name
    // contains the text entered by the user.

    const matchesCandidate =
      normalizedCandidateSearch === "" ||
      searchableCandidateName.includes(
        normalizedCandidateSearch
      );
    return matchesJob && matchesCandidate;
  }
);

  // ============================================================
  // UPDATE APPLICATION STAGE
  // ============================================================
  //
  // Used by BOTH:
  //
  // 1. Stage selector inside the modal
  // 2. Drag & drop
  //
  // Supabase is updated first.
  // Only after Supabase succeeds do we update React state.
  // ============================================================

  async function updateApplicationStage(
    applicationId: string,
    newStage: Stage
  ) {
    const applicationToUpdate = applications.find(
      (application) =>
        application.application_id === applicationId
    );

    if (!applicationToUpdate) {
      return;
    }

    // Already in this column.
    if (applicationToUpdate.stage === newStage) {
      return;
    }

    setUpdatingStage(true);
    setStageError("");

    // --------------------------------------------------------
    // UPDATE SUPABASE
    // --------------------------------------------------------

    const { error: updateError } = await supabase
      .from("applications")
      .update({
        stage: newStage,
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error(
        "Error updating application stage:",
        updateError
      );

      setStageError(updateError.message);
      setUpdatingStage(false);
      return;
    }

    // --------------------------------------------------------
    // UPDATE LOCAL KANBAN STATE
    // --------------------------------------------------------

    setApplications((currentApplications) =>
      currentApplications.map((application) =>
        application.application_id === applicationId
          ? {
              ...application,
              stage: newStage,
            }
          : application
      )
    );

    // --------------------------------------------------------
    // KEEP MODAL SYNCHRONIZED
    // --------------------------------------------------------

    setSelectedApplication((currentApplication) => {
      if (
        !currentApplication ||
        currentApplication.application_id !== applicationId
      ) {
        return currentApplication;
      }

      return {
        ...currentApplication,
        stage: newStage,
      };
    });

    setUpdatingStage(false);
  }

  // ============================================================
  // DRAG & DROP
  // ============================================================

  function handleDragStart(
    event: React.DragEvent<HTMLButtonElement>,
    applicationId: string
  ) {
    setDraggedApplicationId(applicationId);

    event.dataTransfer.setData(
      "text/plain",
      applicationId
    );

    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDraggedApplicationId(null);
    setDragOverStage(null);
  }

  function handleDragOver(
    event: React.DragEvent<HTMLElement>,
    stage: Stage
  ) {
    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    setDragOverStage(stage);
  }

  function handleDragLeave(
    event: React.DragEvent<HTMLElement>,
    stage: Stage
  ) {
    const nextElement = event.relatedTarget;

    if (
      nextElement instanceof Node &&
      event.currentTarget.contains(nextElement)
    ) {
      return;
    }

    setDragOverStage((currentStage) =>
      currentStage === stage ? null : currentStage
    );
  }

  async function handleDrop(
    event: React.DragEvent<HTMLElement>,
    stage: Stage
  ) {
    event.preventDefault();

    const applicationId =
      event.dataTransfer.getData("text/plain") ||
      draggedApplicationId;

    setDragOverStage(null);
    setDraggedApplicationId(null);

    if (!applicationId) {
      return;
    }

    await updateApplicationStage(
      applicationId,
      stage
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-600">
          Loading candidate pipeline...
        </p>
      </main>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-10">
      <div className="mx-auto max-w-[1600px]">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div>
          <h1 className="text-3xl font-bold text-zinc-900">
            Candidate Pipeline
          </h1>

          <p className="mt-2 text-zinc-600">
            Track candidates through the hiring process
          </p>
        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-white p-4">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* ====================================================
            STAGE UPDATE ERROR
        ==================================================== */}

        {stageError && !selectedApplication && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">
              Could not update candidate stage: {stageError}
            </p>
          </div>
        )}

        {/* ====================================================
        FILTERS
        ==================================================== */}

        {!error && (
        <div className="mt-8 flex flex-wrap items-end gap-4">

            {/* ==================================================
                JOB FILTER
            ================================================== */}

            <div className="w-full max-w-xs">
            <label
                htmlFor="job-filter"
                className="mb-2 block text-sm font-medium text-zinc-700"
            >
                Filter by job
            </label>

            <select
                id="job-filter"
                value={selectedJob}
                onChange={(event) =>
                setSelectedJob(event.target.value)
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            >
                <option value="all">
                All jobs
                </option>

                {jobTitles.map((jobTitle) => (
                <option
                    key={jobTitle}
                    value={jobTitle}
                >
                    {jobTitle}
                </option>
                ))}
            </select>
            </div>

            {/* ==================================================
                CANDIDATE SEARCH
            ================================================== */}

            <div className="w-full max-w-xs">
            <label
                htmlFor="candidate-search"
                className="mb-2 block text-sm font-medium text-zinc-700"
            >
                Search candidate
            </label>

            <input
                id="candidate-search"
                type="search"
                value={candidateSearch}
                onChange={(event) =>
                setCandidateSearch(event.target.value)
                }
                placeholder="Search by name..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
            </div>

            {/* ==================================================
                CLEAR FILTERS
            ================================================== */}

            {(selectedJob !== "all" || candidateSearch !== "") && (
            <button
                type="button"
                onClick={() => {
                setSelectedJob("all");
                setCandidateSearch("");
                }}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
                Clear filters
            </button>
            )}
        </div>
        )}

        {/* ====================================================
            KANBAN BOARD
        ==================================================== */}

        {!error && (
          <div className="mt-6 overflow-x-auto pb-4">
            <div className="grid grid-cols-6 gap-4">

              {kanbanColumns.map((column) => {
                // IMPORTANT:
                // We filter filteredApplications instead of applications.
                //
                // This means each column only counts and displays
                // candidates belonging to the selected job.

                const columnApplications =
                  filteredApplications.filter(
                    (application) =>
                      application.stage === column.id
                  );

                const isDragOver =
                  dragOverStage === column.id;

                return (
                  <section
                    key={column.id}
                    onDragOver={(event) =>
                      handleDragOver(
                        event,
                        column.id
                      )
                    }
                    onDragLeave={(event) =>
                      handleDragLeave(
                        event,
                        column.id
                      )
                    }
                    onDrop={(event) =>
                      handleDrop(
                        event,
                        column.id
                      )
                    }
                    className={`min-w-0 rounded-xl p-4 transition-all duration-150 ${
                      isDragOver
                        ? "bg-zinc-300 ring-2 ring-zinc-400 ring-offset-2"
                        : "bg-zinc-200"
                    }`}
                  >
                    {/* COLUMN HEADER */}

                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-semibold text-zinc-900">
                        {column.title}
                      </h2>

                      <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-zinc-600">
                        {columnApplications.length}
                      </span>
                    </div>

                    {/* CARDS */}

                    <div className="min-h-[90px] space-y-3">

                      {columnApplications.length === 0 ? (
                        <div
                          className={`rounded-lg border border-dashed px-4 py-6 text-center transition ${
                            isDragOver
                              ? "border-zinc-500 bg-white/60"
                              : "border-zinc-300"
                          }`}
                        >
                          <p className="text-sm text-zinc-500">
                            {isDragOver
                              ? "Drop candidate here"
                              : "No candidates"}
                          </p>
                        </div>
                      ) : (
                        columnApplications.map(
                          (application) => {
                            const isDragging =
                              draggedApplicationId ===
                              application.application_id;

                            return (
                              <button
                                key={
                                  application.application_id
                                }
                                type="button"
                                draggable={
                                  !updatingStage
                                }
                                onDragStart={(event) =>
                                  handleDragStart(
                                    event,
                                    application.application_id
                                  )
                                }
                                onDragEnd={
                                  handleDragEnd
                                }
                                onClick={() => {
                                  setSelectedApplication(
                                    application
                                  );
                                  setStageError("");
                                }}
                                className={`w-full rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md ${
                                  isDragging
                                    ? "cursor-grabbing opacity-40"
                                    : "cursor-grab opacity-100"
                                }`}
                              >
                                {/* Candidate */}

                                <h3 className="truncate font-semibold text-zinc-900">
                                  {
                                    application.first_name
                                  }{" "}
                                  {
                                    application.last_name
                                  }
                                </h3>

                                {/* Job */}

                                <p className="mt-1 truncate text-sm text-zinc-600">
                                  {
                                    application.job_title
                                  }
                                </p>

                                {/* Application date */}

                                <div className="mt-4 border-t border-zinc-100 pt-3">
                                  <p className="text-xs text-zinc-500">
                                    Applied{" "}
                                    {formatDate(
                                      application.created_at
                                    )}
                                  </p>
                                </div>
                              </button>
                            );
                          }
                        )
                      )}

                    </div>
                  </section>
                );
              })}

            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          CANDIDATE DETAILS MODAL
      ====================================================== */}

      {selectedApplication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            if (!updatingStage) {
              setSelectedApplication(null);
              setStageError("");
            }
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* ==================================================
                MODAL HEADER
            ================================================== */}

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Candidate details
                </p>

                <h2 className="mt-1 text-2xl font-bold text-zinc-900">
                  {selectedApplication.first_name}{" "}
                  {selectedApplication.last_name}
                </h2>

                <p className="mt-1 text-sm text-zinc-600">
                  {selectedApplication.job_title}
                </p>
              </div>

              <button
                type="button"
                disabled={updatingStage}
                onClick={() => {
                  setSelectedApplication(null);
                  setStageError("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close candidate details"
              >
                ×
              </button>
            </div>

            {/* ==================================================
                CONTACT INFORMATION
            ================================================== */}

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Contact information
              </p>

              <div className="mt-3 divide-y divide-zinc-100 border-y border-zinc-100">

                {/* EMAIL */}

                <div className="py-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Email
                  </p>

                  {selectedApplication.email ? (
                    <a
                      href={`mailto:${selectedApplication.email}`}
                      className="mt-1 inline-block break-all text-sm font-medium text-zinc-900 hover:underline"
                    >
                      {selectedApplication.email}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-zinc-500">
                      No email available
                    </p>
                  )}
                </div>

                {/* PHONE */}

                <div className="py-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Phone
                  </p>

                  {selectedApplication.phone ? (
                    <a
                      href={`tel:${selectedApplication.phone}`}
                      className="mt-1 inline-block text-sm font-medium text-zinc-900 hover:underline"
                    >
                      {selectedApplication.phone}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-zinc-500">
                      No phone available
                    </p>
                  )}
                </div>

                {/* LINKEDIN */}

                <div className="py-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    LinkedIn
                  </p>

                  {selectedApplication.linkedin_url ? (
                    <a
                      href={
                        selectedApplication.linkedin_url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm font-medium text-blue-600 hover:underline"
                    >
                      View LinkedIn profile ↗
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-zinc-500">
                      No LinkedIn profile available
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* ==================================================
                APPLICATION INFORMATION
            ================================================== */}

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Application
              </p>

              <div className="mt-3 divide-y divide-zinc-100 border-y border-zinc-100">

                {/* POSITION */}

                <div className="py-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Position
                  </p>

                  <p className="mt-1 text-sm font-medium text-zinc-900">
                    {selectedApplication.job_title}
                  </p>
                </div>

                {/* ==================================================
                    STAGE SELECTOR
                ================================================== */}

                <div className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Stage
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Move candidate through the hiring pipeline
                      </p>
                    </div>

                    {updatingStage && (
                      <span className="text-xs font-medium text-zinc-500">
                        Updating...
                      </span>
                    )}
                  </div>

                  <select
                    value={
                      selectedApplication.stage
                    }
                    disabled={updatingStage}
                    onChange={(event) =>
                      updateApplicationStage(
                        selectedApplication.application_id,
                        event.target.value as Stage
                      )
                    }
                    className="mt-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
                  >
                    {kanbanColumns.map(
                      (column) => (
                        <option
                          key={column.id}
                          value={column.id}
                        >
                          {column.title}
                        </option>
                      )
                    )}
                  </select>

                  {stageError && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-sm text-red-600">
                        Could not update stage:{" "}
                        {stageError}
                      </p>
                    </div>
                  )}
                </div>

                {/* APPLIED DATE */}

                <div className="py-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Applied
                  </p>

                  <p className="mt-1 text-sm font-medium text-zinc-900">
                    {formatDate(
                      selectedApplication.created_at
                    )}
                  </p>
                </div>

              </div>
            </div>

            {/* ==================================================
                CLOSE BUTTON
            ================================================== */}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={updatingStage}
                onClick={() => {
                  setSelectedApplication(null);
                  setStageError("");
                }}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}