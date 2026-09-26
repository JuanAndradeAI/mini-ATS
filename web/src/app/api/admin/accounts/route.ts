import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/lib/supabase-admin";

// ============================================================
// HELPERS
// ============================================================

async function verifyAdmin(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return {
      error: NextResponse.json(
        {
          error: "Supabase environment variables are missing.",
        },
        { status: 500 }
      ),
    };
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        {
          error: "Authentication required.",
        },
        { status: 401 }
      ),
    };
  }

  const accessToken = authorization.substring(7);

  const authClient = createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(accessToken);

  if (userError || !user) {
    return {
      error: NextResponse.json(
        {
          error: "Invalid or expired session.",
        },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } =
    await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (profileError) {
    console.error(
      "Admin profile lookup error:",
      profileError
    );

    return {
      error: NextResponse.json(
        {
          error:
            "Could not verify administrator permissions.",
        },
        { status: 500 }
      ),
    };
  }

  if (!profile || profile.role !== "admin") {
    return {
      error: NextResponse.json(
        {
          error: "Administrator access required.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    error: null,
  };
}

// ============================================================
// GET /api/admin/accounts
// ============================================================

export async function GET(request: NextRequest) {
  try {
    // --------------------------------------------------------
    // 1. VERIFY ADMIN
    // --------------------------------------------------------

    const verification = await verifyAdmin(request);

    if (verification.error) {
      return verification.error;
    }

    // --------------------------------------------------------
    // 2. GET PROFILES
    // --------------------------------------------------------

    const {
      data: profiles,
      error: profilesError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        `
          id,
          full_name,
          role,
          customer_id,
          created_at
        `
      )
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error(
        "Profiles query error:",
        profilesError
      );

      return NextResponse.json(
        {
          error: "Could not load profiles.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------------
    // 3. GET CUSTOMERS
    // --------------------------------------------------------

    const {
      data: customers,
      error: customersError,
    } = await supabaseAdmin
      .from("customers")
      .select("*");

    if (customersError) {
      console.error(
        "Customers query error:",
        customersError
      );

      return NextResponse.json(
        {
          error: "Could not load customers.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------------
    // 4. GET AUTH USERS
    // --------------------------------------------------------

    const {
      data: authUsersData,
      error: authUsersError,
    } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authUsersError) {
      console.error(
        "Auth users query error:",
        authUsersError
      );

      return NextResponse.json(
        {
          error:
            "Could not load authentication users.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------------
    // 5. BUILD RESPONSE
    // --------------------------------------------------------

    const accounts = (profiles ?? []).map(
      (profile) => {
        const authUser =
          authUsersData.users.find(
            (authUser) =>
              authUser.id === profile.id
          );

        const customer = (
          customers ?? []
        ).find(
          (customer) =>
            customer.id === profile.customer_id
        );

        return {
          id: profile.id,
          fullName: profile.full_name,
          email: authUser?.email ?? null,
          role: profile.role,
          customerId: profile.customer_id,
          companyName: customer?.name ?? null,
          createdAt: profile.created_at,
        };
      }
    );

    const customerAccounts = accounts.filter(
      (account) => account.role === "customer"
    );

    const adminAccounts = accounts.filter(
      (account) => account.role === "admin"
    );

    return NextResponse.json(
      {
        customerAccounts,
        adminAccounts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Unexpected accounts GET error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH /api/admin/accounts
// ============================================================
//
// Updates an existing customer/admin account.
//
// Editable fields:
// - fullName
// - email
// - companyName (customer only)
//
// We intentionally do NOT allow:
// - changing role
// - changing customer_id
//
// ============================================================

export async function PATCH(request: NextRequest) {
  try {
    // --------------------------------------------------------
    // 1. VERIFY ADMIN
    // --------------------------------------------------------

    const verification = await verifyAdmin(request);

    if (verification.error) {
      return verification.error;
    }

    // --------------------------------------------------------
    // 2. READ REQUEST BODY
    // --------------------------------------------------------

    const body = await request.json();

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    const fullName =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const companyName =
      typeof body.companyName === "string"
        ? body.companyName.trim()
        : "";

    // --------------------------------------------------------
    // 3. VALIDATION
    // --------------------------------------------------------

    if (!id) {
      return NextResponse.json(
        {
          error: "Account id is required.",
        },
        { status: 400 }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        {
          error: "Full name is required.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error: "Email is required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // 4. LOAD TARGET PROFILE
    // --------------------------------------------------------

    const {
      data: targetProfile,
      error: targetProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        `
          id,
          role,
          customer_id
        `
      )
      .eq("id", id)
      .single();

    if (targetProfileError || !targetProfile) {
      console.error(
        "Target profile lookup error:",
        targetProfileError
      );

      return NextResponse.json(
        {
          error: "Account could not be found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // 5. CUSTOMER VALIDATION
    // --------------------------------------------------------

    if (
      targetProfile.role === "customer" &&
      !companyName
    ) {
      return NextResponse.json(
        {
          error:
            "Company name is required for customer accounts.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // 6. UPDATE AUTH EMAIL
    // --------------------------------------------------------

    const {
      error: authUpdateError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        id,
        {
          email,
        }
      );

    if (authUpdateError) {
      console.error(
        "Auth user update error:",
        authUpdateError
      );

      return NextResponse.json(
        {
          error:
            authUpdateError.message ||
            "Could not update account email.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // 7. UPDATE PROFILE
    // --------------------------------------------------------

    const {
      error: profileUpdateError,
    } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
      })
      .eq("id", id);

    if (profileUpdateError) {
      console.error(
        "Profile update error:",
        profileUpdateError
      );

      return NextResponse.json(
        {
          error:
            "The email was updated, but the profile name could not be updated.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------------
    // 8. UPDATE COMPANY IF CUSTOMER
    // --------------------------------------------------------

    if (
      targetProfile.role === "customer" &&
      targetProfile.customer_id
    ) {
      const {
        error: customerUpdateError,
      } = await supabaseAdmin
        .from("customers")
        .update({
          name: companyName,
        })
        .eq(
          "id",
          targetProfile.customer_id
        );

      if (customerUpdateError) {
        console.error(
          "Customer update error:",
          customerUpdateError
        );

        return NextResponse.json(
          {
            error:
              "The user was updated, but the company name could not be updated.",
          },
          { status: 500 }
        );
      }
    }

    // --------------------------------------------------------
    // 9. SUCCESS
    // --------------------------------------------------------

    return NextResponse.json(
      {
        message: "Account updated successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Unexpected accounts PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/admin/accounts
// ============================================================
//
// Deletes an existing customer/admin account.
//
// Security:
// 1. The request must contain a valid Supabase access token.
// 2. The authenticated user must have role = "admin".
// 3. An administrator cannot delete their own account.
//
// Customer deletion:
// - Deletes the Supabase Auth user.
// - Removes the related profile if it still exists.
// - If the customer/company no longer has profiles associated
//   with it, the customer record is also removed.
//
// ============================================================

export async function DELETE(request: NextRequest) {
  try {
    // --------------------------------------------------------
    // 1. VERIFY ADMIN
    // --------------------------------------------------------

    const verification = await verifyAdmin(request);

    if (verification.error) {
      return verification.error;
    }

    const authenticatedUser = verification.user;

    // --------------------------------------------------------
    // 2. READ REQUEST BODY
    // --------------------------------------------------------

    const body = await request.json();

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    // --------------------------------------------------------
    // 3. VALIDATION
    // --------------------------------------------------------

    if (!id) {
      return NextResponse.json(
        {
          error: "Account id is required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // 4. PREVENT SELF-DELETION
    // --------------------------------------------------------

    if (authenticatedUser.id === id) {
      return NextResponse.json(
        {
          error:
            "You cannot delete your own administrator account.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // 5. LOAD TARGET PROFILE
    // --------------------------------------------------------

    const {
      data: targetProfile,
      error: targetProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        `
          id,
          role,
          customer_id,
          full_name
        `
      )
      .eq("id", id)
      .single();

    if (targetProfileError || !targetProfile) {
      console.error(
        "Target profile lookup error:",
        targetProfileError
      );

      return NextResponse.json(
        {
          error: "Account could not be found.",
        },
        { status: 404 }
      );
    }

    const customerId = targetProfile.customer_id;

    // --------------------------------------------------------
    // 6. DELETE AUTH USER
    // --------------------------------------------------------

    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(id);

    if (authDeleteError) {
      console.error(
        "Auth user delete error:",
        authDeleteError
      );

      return NextResponse.json(
        {
          error:
            authDeleteError.message ||
            "Could not delete authentication user.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // 7. CHECK IF PROFILE STILL EXISTS
    // --------------------------------------------------------
    //
    // Depending on the database configuration, deleting the
    // Auth user may automatically delete the related profile.
    //
    // If it remains, remove it explicitly.
    // --------------------------------------------------------

    const {
      data: remainingProfile,
      error: remainingProfileLookupError,
    } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (remainingProfileLookupError) {
      console.error(
        "Profile verification error:",
        remainingProfileLookupError
      );

      return NextResponse.json(
        {
          error:
            "The authentication user was deleted, but the profile could not be verified.",
        },
        { status: 500 }
      );
    }

    if (remainingProfile) {
      const {
        error: profileDeleteError,
      } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", id);

      if (profileDeleteError) {
        console.error(
          "Profile delete error:",
          profileDeleteError
        );

        return NextResponse.json(
          {
            error:
              "The authentication user was deleted, but the profile could not be deleted.",
          },
          { status: 500 }
        );
      }
    }

    // --------------------------------------------------------
    // 8. CUSTOMER CLEANUP
    // --------------------------------------------------------
    //
    // Admin accounts have customer_id = null.
    //
    // For customer accounts, delete the company/customer only
    // if no profiles remain associated with it.
    // --------------------------------------------------------

    if (
      targetProfile.role === "customer" &&
      customerId
    ) {
      const {
        count: remainingProfilesCount,
        error: remainingProfilesError,
      } = await supabaseAdmin
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("customer_id", customerId);

      if (remainingProfilesError) {
        console.error(
          "Remaining customer profiles check error:",
          remainingProfilesError
        );

        return NextResponse.json(
          {
            error:
              "The account was deleted, but the related customer could not be verified.",
          },
          { status: 500 }
        );
      }

      if ((remainingProfilesCount ?? 0) === 0) {
        const {
          error: customerDeleteError,
        } = await supabaseAdmin
          .from("customers")
          .delete()
          .eq("id", customerId);

        if (customerDeleteError) {
          console.error(
            "Customer delete error:",
            customerDeleteError
          );

          return NextResponse.json(
            {
              error:
                "The account was deleted, but the related customer could not be deleted.",
            },
            { status: 500 }
          );
        }
      }
    }

    // --------------------------------------------------------
    // 9. SUCCESS
    // --------------------------------------------------------

    return NextResponse.json(
      {
        message: "Account deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Unexpected accounts DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}