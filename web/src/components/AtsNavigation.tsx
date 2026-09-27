"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AtsNavigation() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");

  function buildHref(path: string) {
    if (!customerId) {
      return path;
    }

    return `${path}?customerId=${encodeURIComponent(customerId)}`;
  }

  return (
    <nav className="mb-8 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={buildHref("/jobs")}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          Jobs
        </Link>

        <Link
          href={buildHref("/candidates")}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          Candidates
        </Link>

        <Link
          href={buildHref("/kanban")}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          Kanban
        </Link>

        {customerId && (
          <Link
            href="/admin"
            className="ml-auto rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Back to Admin
          </Link>
        )}
      </div>
    </nav>
  );
}