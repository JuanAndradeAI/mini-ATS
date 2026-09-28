"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type UserInfo = {
  fullName: string;
  role: "admin" | "customer";
};

export default function AtsNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    async function loadUserInfo() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", sessionData.session.user.id)
        .single();

      if (profileError) {
        console.error(
          "Error loading navigation profile:",
          profileError
        );
        return;
      }

      setUserInfo({
        fullName: profile.full_name,
        role: profile.role,
      });
    }

    loadUserInfo();
  }, []);

  // Preserves the selected customer when an administrator
  // is managing a customer's ATS data.
  function buildHref(path: string) {
    if (!customerId) {
      return path;
    }

    return `${path}?customerId=${encodeURIComponent(customerId)}`;
  }

  // Signs out the currently authenticated user
  // and returns them to the login page.
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <nav className="mb-8 w-full rounded-xl bg-white p-4 shadow-sm">
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

        {userInfo && (
          <div className="ml-auto text-right">
            <p className="text-sm font-medium text-zinc-900">
              {userInfo.fullName}
            </p>

            <p className="text-xs text-zinc-500">
              {userInfo.role === "admin"
                ? "Administrator"
                : "Customer"}
            </p>
          </div>
        )}

        {customerId && (
          <Link
            href="/admin"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Back to Admin
          </Link>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}