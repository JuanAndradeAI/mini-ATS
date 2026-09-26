"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

// ============================================================
// TYPES
// ============================================================

type Account = {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string;
  customerId: string | null;
  companyName: string | null;
  createdAt: string;
};

type AccountsResponse = {
  customerAccounts: Account[];
  adminAccounts: Account[];
};

type ApiResponse = {
  message?: string;
  error?: string;
};

// Determines which section of the admin dashboard is visible.
type AdminView =
  | "accounts"
  | "create-customer"
  | "create-admin"
  | "edit-account";

// Determines which account list is visible.
type AccountTab = "customers" | "admins";

// ============================================================
// ADMIN PAGE
// ============================================================

export default function AdminPage() {
  // ==========================================================
  // NAVIGATION STATE
  // ==========================================================

  // The dashboard opens on the account management view.
  const [view, setView] = useState<AdminView>("accounts");

  // Customers are shown by default in the account list.
  const [activeTab, setActiveTab] =
    useState<AccountTab>("customers");

  // ==========================================================
  // CUSTOMER FORM STATE
  // ==========================================================

  const [customerName, setCustomerName] = useState("");
  const [customerFullName, setCustomerFullName] =
    useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPassword, setCustomerPassword] =
    useState("");

  const [customerLoading, setCustomerLoading] =
    useState(false);
  const [customerError, setCustomerError] = useState("");

  // ==========================================================
  // ADMIN FORM STATE
  // ==========================================================

  const [adminFullName, setAdminFullName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  // ==========================================================
  // ACCOUNT LIST STATE
  // ==========================================================

  const [customerAccounts, setCustomerAccounts] = useState<
    Account[]
  >([]);

  const [adminAccounts, setAdminAccounts] = useState<
    Account[]
  >([]);

  const [accountsLoading, setAccountsLoading] =
    useState(true);

  const [accountsError, setAccountsError] = useState("");

  // Success messages are displayed on the account list after
  // creating, editing or deleting an account.
  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================================
  // DELETE ACCOUNT STATE
  // ==========================================================

  // Stores the id of the account currently being deleted.
  const [deletingAccountId, setDeletingAccountId] =
    useState<string | null>(null);

  // ==========================================================
  // EDIT ACCOUNT STATE
  // ==========================================================

  // Stores the account currently being edited.
  const [editingAccount, setEditingAccount] =
    useState<Account | null>(null);

  // Stores the editable values shown in the edit form.
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCompanyName, setEditCompanyName] =
    useState("");

  // Tracks the edit request state.
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // ==========================================================
  // GET CURRENT ACCESS TOKEN
  // ==========================================================
  //
  // Administrative API routes require the Supabase access
  // token of the currently authenticated administrator.
  // ==========================================================

  async function getAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(
        "Could not read the current session."
      );
    }

    if (!session?.access_token) {
      throw new Error("You must be signed in.");
    }

    return session.access_token;
  }

  // ==========================================================
  // LOAD ACCOUNTS
  // ==========================================================
  //
  // GET /api/admin/accounts returns:
  //
  // - customerAccounts
  // - adminAccounts
  //
  // The API route verifies that the current user is an admin.
  // ==========================================================

  const loadAccounts = useCallback(async () => {
    try {
      setAccountsLoading(true);
      setAccountsError("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(
          "Could not read the current session."
        );
      }

      if (!session?.access_token) {
        throw new Error("You must be signed in.");
      }

      const response = await fetch(
        "/api/admin/accounts",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
        }
      );

      const data = (await response.json()) as
        | AccountsResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Could not load accounts."
        );
      }

      const accountsData = data as AccountsResponse;

      setCustomerAccounts(
        accountsData.customerAccounts ?? []
      );

      setAdminAccounts(
        accountsData.adminAccounts ?? []
      );
    } catch (error) {
      console.error("Load accounts error:", error);

      setAccountsError(
        error instanceof Error
          ? error.message
          : "Could not load accounts."
      );
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  // ==========================================================
  // INITIAL ACCOUNT LOAD
  // ==========================================================

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAccounts();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadAccounts]);

  // ==========================================================
  // OPEN CREATE CUSTOMER VIEW
  // ==========================================================

  function openCreateCustomer() {
    setCustomerError("");
    setSuccessMessage("");
    setView("create-customer");
  }

  // ==========================================================
  // OPEN CREATE ADMIN VIEW
  // ==========================================================

  function openCreateAdmin() {
    setAdminError("");
    setSuccessMessage("");
    setView("create-admin");
  }

  // ==========================================================
  // OPEN EDIT ACCOUNT VIEW
  // ==========================================================
  //
  // Copies the selected account into the edit form.
  //
  // Customer accounts also receive a company field.
  // Administrator accounts do not belong to a customer.
  // ==========================================================

  function openEditAccount(account: Account) {
    setEditingAccount(account);

    setEditFullName(account.fullName ?? "");
    setEditEmail(account.email ?? "");
    setEditCompanyName(account.companyName ?? "");

    setEditError("");
    setSuccessMessage("");

    setView("edit-account");
  }

  // ==========================================================
  // RETURN TO ACCOUNTS
  // ==========================================================

  function returnToAccounts() {
    setCustomerError("");
    setAdminError("");
    setEditError("");

    setView("accounts");
  }

  // ==========================================================
  // DELETE ACCOUNT
  // ==========================================================

  async function handleDeleteAccount(account: Account) {
    const accountLabel =
      account.fullName ||
      account.email ||
      "this account";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${accountLabel}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAccountId(account.id);
      setAccountsError("");
      setSuccessMessage("");

      const accessToken = await getAccessToken();

      const response = await fetch(
        "/api/admin/accounts",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            id: account.id,
          }),
        }
      );

      const data =
        (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Could not delete the account."
        );
      }

      // Keep the user on the same account category.
      setActiveTab(
        account.role === "customer"
          ? "customers"
          : "admins"
      );

      // Reload the account list so the deleted account
      // disappears immediately.
      await loadAccounts();

      setSuccessMessage(
        data.message ??
          `Account "${accountLabel}" was deleted successfully.`
      );
    } catch (error) {
      console.error("Delete account error:", error);

      setAccountsError(
        error instanceof Error
          ? error.message
          : "Could not delete the account."
      );
    } finally {
      setDeletingAccountId(null);
    }
  }

  // ==========================================================
  // CREATE CUSTOMER
  // ==========================================================

  async function handleCreateCustomer(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCustomerError("");
    setCustomerLoading(true);

    try {
      if (customerPassword.length < 8) {
        throw new Error(
          "Password must contain at least 8 characters."
        );
      }

      const accessToken = await getAccessToken();

      const response = await fetch(
        "/api/admin/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            role: "customer",
            customerName,
            fullName: customerFullName,
            email: customerEmail,
            password: customerPassword,
          }),
        }
      );

      const data =
        (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Could not create the customer account."
        );
      }

      const createdCustomerName = customerName;

      setCustomerName("");
      setCustomerFullName("");
      setCustomerEmail("");
      setCustomerPassword("");

      await loadAccounts();

      setActiveTab("customers");

      setSuccessMessage(
        data.message ??
          `Customer "${createdCustomerName}" was created successfully.`
      );

      setView("accounts");
    } catch (error) {
      console.error(
        "Create customer error:",
        error
      );

      setCustomerError(
        error instanceof Error
          ? error.message
          : "Could not create the customer account."
      );
    } finally {
      setCustomerLoading(false);
    }
  }

  // ==========================================================
  // CREATE ADMIN
  // ==========================================================

  async function handleCreateAdmin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setAdminError("");
    setAdminLoading(true);

    try {
      if (adminPassword.length < 8) {
        throw new Error(
          "Password must contain at least 8 characters."
        );
      }

      const accessToken = await getAccessToken();

      const response = await fetch(
        "/api/admin/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            role: "admin",
            fullName: adminFullName,
            email: adminEmail,
            password: adminPassword,
          }),
        }
      );

      const data =
        (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Could not create the administrator account."
        );
      }

      const createdAdminName = adminFullName;

      setAdminFullName("");
      setAdminEmail("");
      setAdminPassword("");

      await loadAccounts();

      setActiveTab("admins");

      setSuccessMessage(
        data.message ??
          `Administrator "${createdAdminName}" was created successfully.`
      );

      setView("accounts");
    } catch (error) {
      console.error(
        "Create admin error:",
        error
      );

      setAdminError(
        error instanceof Error
          ? error.message
          : "Could not create the administrator account."
      );
    } finally {
      setAdminLoading(false);
    }
  }

  // ==========================================================
  // UPDATE ACCOUNT
  // ==========================================================

  async function handleUpdateAccount(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingAccount) {
      return;
    }

    setEditError("");
    setEditLoading(true);

    try {
      if (!editFullName.trim()) {
        throw new Error("Full name is required.");
      }

      if (!editEmail.trim()) {
        throw new Error("Email is required.");
      }

      if (
        editingAccount.role === "customer" &&
        !editCompanyName.trim()
      ) {
        throw new Error(
          "Company name is required."
        );
      }

      const accessToken = await getAccessToken();

      const response = await fetch(
        "/api/admin/accounts",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            id: editingAccount.id,
            fullName: editFullName.trim(),
            email: editEmail.trim(),
            companyName:
              editingAccount.role === "customer"
                ? editCompanyName.trim()
                : null,
          }),
        }
      );

      const data =
        (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Could not update the account."
        );
      }

      await loadAccounts();

      setActiveTab(
        editingAccount.role === "customer"
          ? "customers"
          : "admins"
      );

      setSuccessMessage(
        data.message ??
          "Account updated successfully."
      );

      setEditingAccount(null);
      setEditFullName("");
      setEditEmail("");
      setEditCompanyName("");

      setView("accounts");
    } catch (error) {
      console.error(
        "Update account error:",
        error
      );

      setEditError(
        error instanceof Error
          ? error.message
          : "Could not update the account."
      );
    } finally {
      setEditLoading(false);
    }
  }

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString();
  }

  // ==========================================================
  // EDIT ACCOUNT VIEW
  // ==========================================================

  if (
    view === "edit-account" &&
    editingAccount
  ) {
    const isCustomer =
      editingAccount.role === "customer";

    return (
      <main className="min-h-screen bg-zinc-100 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={returnToAccounts}
            className="mb-6 text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            ← Back to accounts
          </button>

          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-zinc-900">
              {isCustomer
                ? "Edit customer account"
                : "Edit administrator account"}
            </h1>

            <p className="mt-2 text-zinc-600">
              Update the account information below.
            </p>
          </div>

          <section className="rounded-xl bg-white p-8 shadow-sm">
            {editError && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {editError}
              </div>
            )}

            <form
              onSubmit={handleUpdateAccount}
              className="space-y-5"
            >
              {isCustomer && (
                <div>
                  <label
                    htmlFor="editCompanyName"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Company name
                  </label>

                  <input
                    id="editCompanyName"
                    type="text"
                    value={editCompanyName}
                    onChange={(event) =>
                      setEditCompanyName(
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-500"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="editFullName"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Full name
                </label>

                <input
                  id="editFullName"
                  type="text"
                  value={editFullName}
                  onChange={(event) =>
                    setEditFullName(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label
                  htmlFor="editEmail"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Email
                </label>

                <input
                  id="editEmail"
                  type="email"
                  value={editEmail}
                  onChange={(event) =>
                    setEditEmail(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-500"
                />
              </div>

              <div className="rounded-lg bg-zinc-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Account role
                </p>

                <p className="mt-1 text-sm font-medium text-zinc-900">
                  {editingAccount.role}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  The account role cannot be changed
                  here.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editLoading
                    ? "Saving changes..."
                    : "Save changes"}
                </button>

                <button
                  type="button"
                  onClick={returnToAccounts}
                  disabled={editLoading}
                  className="rounded-lg border border-zinc-300 px-5 py-3 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================================
  // CREATE CUSTOMER VIEW
  // ==========================================================

  if (view === "create-customer") {
    return (
      <main className="min-h-screen bg-zinc-100 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={returnToAccounts}
            className="mb-6 text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            ← Back to accounts
          </button>

          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-zinc-900">
              Create customer account
            </h1>

            <p className="mt-2 text-zinc-600">
              Create a company and its first customer
              user.
            </p>
          </div>

          <section className="rounded-xl bg-white p-8 shadow-sm">
            {customerError && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {customerError}
              </div>
            )}

            <form
              onSubmit={handleCreateCustomer}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="customerName"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Company name
                </label>

                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(event) =>
                    setCustomerName(
                      event.target.value
                    )
                  }
                  required
                  placeholder="Example AB"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label
                  htmlFor="customerFullName"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  User full name
                </label>

                <input
                  id="customerFullName"
                  type="text"
                  value={customerFullName}
                  onChange={(event) =>
                    setCustomerFullName(
                      event.target.value
                    )
                  }
                  required
                  placeholder="Anna Andersson"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label
                  htmlFor="customerEmail"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Email
                </label>

                <input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(event) =>
                    setCustomerEmail(
                      event.target.value
                    )
                  }
                  required
                  placeholder="anna@example.com"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label
                  htmlFor="customerPassword"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Initial password
                </label>

                <input
                  id="customerPassword"
                  type="password"
                  value={customerPassword}
                  onChange={(event) =>
                    setCustomerPassword(
                      event.target.value
                    )
                  }
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-500"
                />

                <p className="mt-1 text-xs text-zinc-500">
                  The customer will use this password
                  for their first login.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={customerLoading}
                  className="rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {customerLoading
                    ? "Creating customer..."
                    : "Create customer"}
                </button>

                <button
                  type="button"
                  onClick={returnToAccounts}
                  disabled={customerLoading}
                  className="rounded-lg border border-zinc-300 px-5 py-3 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================================
  // CREATE ADMIN VIEW
  // ==========================================================

  if (view === "create-admin") {
    return (
      <main className="min-h-screen bg-zinc-100 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={returnToAccounts}
            className="mb-6 text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            ← Back to accounts
          </button>

          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-zinc-900">
              Create administrator account
            </h1>

            <p className="mt-2 text-zinc-600">
              Create another administrator for Mini ATS.
            </p>
          </div>

          <section className="rounded-xl bg-white p-8 shadow-sm">
            {adminError && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {adminError}
              </div>
            )}

            <form
              onSubmit={handleCreateAdmin}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="adminFullName"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Admin full name
                </label>

                <input
                  id="adminFullName"
                  type="text"
                  value={adminFullName}
                  onChange={(event) =>
                    setAdminFullName(
                      event.target.value
                    )
                  }
                  required
                  placeholder="Carlos Andersson"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label
                  htmlFor="adminEmail"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Email
                </label>

                <input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(event) =>
                    setAdminEmail(
                      event.target.value
                    )
                  }
                  required
                  placeholder="admin@example.com"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label
                  htmlFor="adminPassword"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Initial password
                </label>

                <input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(event) =>
                    setAdminPassword(
                      event.target.value
                    )
                  }
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-zinc-900 outline-none focus:border-zinc-500"
                />

                <p className="mt-1 text-xs text-zinc-500">
                  Administrator accounts are not
                  connected to a specific customer.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {adminLoading
                    ? "Creating administrator..."
                    : "Create administrator"}
                </button>

                <button
                  type="button"
                  onClick={returnToAccounts}
                  disabled={adminLoading}
                  className="rounded-lg border border-zinc-300 px-5 py-3 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================================
  // ACCOUNT MANAGEMENT VIEW
  // ==========================================================

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-zinc-900">
              Admin dashboard
            </h1>

            <p className="mt-2 text-zinc-600">
              View and manage Mini ATS accounts.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={openCreateCustomer}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              + Create customer
            </button>

            <button
              type="button"
              onClick={openCreateAdmin}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              + Create administrator
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="mt-8 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <section className="mt-8 rounded-xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Accounts
              </p>

              <h2 className="mt-1 text-xl font-bold text-zinc-900">
                Account management
              </h2>

              <p className="mt-1 text-sm text-zinc-600">
                View and manage customer and
                administrator accounts registered in
                Mini ATS.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadAccounts()}
              disabled={accountsLoading}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {accountsLoading
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>

          {accountsError && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {accountsError}
            </div>
          )}

          <div className="mt-6 flex gap-2 border-b border-zinc-200">
            <button
              type="button"
              onClick={() =>
                setActiveTab("customers")
              }
              className={`border-b-2 px-4 py-3 text-sm font-medium ${
                activeTab === "customers"
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Customers ({customerAccounts.length})
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab("admins")
              }
              className={`border-b-2 px-4 py-3 text-sm font-medium ${
                activeTab === "admins"
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Administrators ({adminAccounts.length})
            </button>
          </div>

          {accountsLoading ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              Loading accounts...
            </div>
          ) : (
            <>
              {activeTab === "customers" && (
                <div className="mt-6 overflow-x-auto">
                  {customerAccounts.length === 0 ? (
                    <div className="rounded-lg border border-zinc-200 p-8 text-center text-sm text-zinc-500">
                      No customer accounts found.
                    </div>
                  ) : (
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-500">
                          <th className="px-4 py-3 font-medium">
                            Name
                          </th>

                          <th className="px-4 py-3 font-medium">
                            Email
                          </th>

                          <th className="px-4 py-3 font-medium">
                            Company
                          </th>

                          <th className="px-4 py-3 font-medium">
                            Role
                          </th>

                          <th className="px-4 py-3 font-medium">
                            Created
                          </th>

                          <th className="px-4 py-3 font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {customerAccounts.map(
                          (account) => (
                            <tr
                              key={account.id}
                              className="border-b border-zinc-100 last:border-0"
                            >
                              <td className="px-4 py-4 font-medium text-zinc-900">
                                {account.fullName ??
                                  "-"}
                              </td>

                              <td className="px-4 py-4 text-zinc-600">
                                {account.email ?? "-"}
                              </td>

                              <td className="px-4 py-4 text-zinc-600">
                                {account.companyName ??
                                  "-"}
                              </td>

                              <td className="px-4 py-4">
                                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                                  {account.role}
                                </span>
                              </td>

                              <td className="px-4 py-4 text-zinc-600">
                                {formatDate(
                                  account.createdAt
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditAccount(
                                        account
                                      )
                                    }
                                    disabled={
                                      deletingAccountId ===
                                      account.id
                                    }
                                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleDeleteAccount(
                                        account
                                      )
                                    }
                                    disabled={
                                      deletingAccountId ===
                                      account.id
                                    }
                                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {deletingAccountId ===
                                    account.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === "admins" && (
                <div className="mt-6 overflow-x-auto">
                  {adminAccounts.length === 0 ? (
                    <div className="rounded-lg border border-zinc-200 p-8 text-center text-sm text-zinc-500">
                      No administrator accounts found.
                    </div>
                  ) : (
                    <table className="w-full min-w-[750px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-500">
                          <th className="px-4 py-3 font-medium">
                            Name
                          </th>

                          <th className="px-4 py-3 font-medium">
                            Email
                          </th>

                          <th className="px-4 py-3 font-medium">
                            Role
                          </th>

                          <th className="px-4 py-3 font-medium">
                            Created
                          </th>

                          <th className="px-4 py-3 font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {adminAccounts.map(
                          (account) => (
                            <tr
                              key={account.id}
                              className="border-b border-zinc-100 last:border-0"
                            >
                              <td className="px-4 py-4 font-medium text-zinc-900">
                                {account.fullName ??
                                  "-"}
                              </td>

                              <td className="px-4 py-4 text-zinc-600">
                                {account.email ?? "-"}
                              </td>

                              <td className="px-4 py-4">
                                <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                                  {account.role}
                                </span>
                              </td>

                              <td className="px-4 py-4 text-zinc-600">
                                {formatDate(
                                  account.createdAt
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditAccount(
                                        account
                                      )
                                    }
                                    disabled={
                                      deletingAccountId ===
                                      account.id
                                    }
                                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleDeleteAccount(
                                        account
                                      )
                                    }
                                    disabled={
                                      deletingAccountId ===
                                      account.id
                                    }
                                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {deletingAccountId ===
                                    account.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}