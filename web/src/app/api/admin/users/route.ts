import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/lib/supabase-admin";

// ============================================================
// POST /api/admin/users
// ============================================================
//
// Creates either:
//
// 1. A customer account
//    - Creates the company in customers
//    - Creates the Supabase Auth user
//    - Creates a profile with role = "customer"
//    - Connects the profile to the customer
//
// 2. An admin account
//    - Creates the Supabase Auth user
//    - Creates a profile with role = "admin"
//    - customer_id remains NULL
//
// This endpoint performs privileged operations and therefore
// runs only on the server.
//
// IMPORTANT:
// Only an authenticated user whose profile has role = "admin"
// is allowed to use this endpoint.
//
// The service role key is NEVER sent to the browser.
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // ========================================================
    // 1. READ AUTHORIZATION HEADER
    // ========================================================
    //
    // The admin page sends:
    //
    // Authorization: Bearer <access_token>
    //
    // We use this token to identify the logged-in user.
    // ========================================================

    const authorizationHeader =
      request.headers.get("authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorizationHeader.replace("Bearer ", "");

    // ========================================================
    // 2. CREATE A CLIENT FOR THE REQUESTING USER
    // ========================================================
    //
    // This is NOT the admin client.
    //
    // It uses the public Supabase key together with the
    // access token received from the browser.
    // ========================================================

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabasePublishableKey) {
      return NextResponse.json(
        {
          error:
            "Supabase server configuration is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const userSupabase = createClient(
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

    // ========================================================
    // 3. VERIFY THE AUTHENTICATED USER
    // ========================================================

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Invalid or expired session.",
        },
        {
          status: 401,
        }
      );
    }

    // ========================================================
    // 4. VERIFY THAT THE USER IS AN ADMIN
    // ========================================================
    //
    // Authentication tells us WHO the user is.
    //
    // The profiles table tells us WHAT the user is allowed
    // to do.
    //
    // We use the privileged server client to read the profile.
    // ========================================================

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    console.log(
      "Authenticated user id:",
      user.id
    );

    console.log(
      "Authenticated user email:",
      user.email
    );

    console.log(
      "Profile returned:",
      profile
    );

    console.log(
      "Profile error:",
      profileError
    );

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error:
            "User profile could not be found.",
        },
        {
          status: 403,
        }
      );
    }

    if (profile.role !== "admin") {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 5. READ REQUEST DATA
    // ========================================================

    const body = await request.json();

    const customerName =
      typeof body.customerName === "string"
        ? body.customerName.trim()
        : "";

    const fullName =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // If the frontend does not send a role yet, we keep the
    // previous behavior and create a customer account.
    const role =
      body.role === "admin"
        ? "admin"
        : "customer";

    // ========================================================
    // 6. VALIDATE COMMON REQUEST DATA
    // ========================================================

    if (!fullName || !email || !password) {
      return NextResponse.json(
        {
          error:
            "Full name, email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Password must contain at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 7. CREATE ADMIN ACCOUNT
    // ========================================================
    //
    // Admin accounts do NOT belong to a customer.
    //
    // Therefore:
    //
    // customers table -> nothing is created
    // auth.users      -> admin login is created
    // profiles        -> role = "admin"
    // customer_id     -> NULL
    // ========================================================

    if (role === "admin") {
      const {
        data: adminAuthData,
        error: adminAuthError,
      } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (
        adminAuthError ||
        !adminAuthData.user
      ) {
        console.error(
          "Admin Auth user creation error:",
          adminAuthError
        );

        return NextResponse.json(
          {
            error:
              adminAuthError?.message ??
              "Could not create admin user.",
          },
          {
            status: 400,
          }
        );
      }

      // ======================================================
      // CREATE ADMIN PROFILE
      // ======================================================

      const {
        error: adminProfileError,
      } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: adminAuthData.user.id,
          full_name: fullName,
          role: "admin",
          customer_id: null,
        });

      if (adminProfileError) {
        console.error(
          "Admin profile creation error:",
          adminProfileError
        );

        // Roll back the Auth user so we do not leave an
        // incomplete account behind.
        await supabaseAdmin.auth.admin.deleteUser(
          adminAuthData.user.id
        );

        return NextResponse.json(
          {
            error:
              "Could not create admin profile.",
          },
          {
            status: 500,
          }
        );
      }

      // ======================================================
      // ADMIN SUCCESS RESPONSE
      // ======================================================

      return NextResponse.json(
        {
          message:
            "Admin account created successfully.",
          user: {
            id: adminAuthData.user.id,
            email: adminAuthData.user.email,
            fullName,
            role: "admin",
          },
        },
        {
          status: 201,
        }
      );
    }

    // ========================================================
    // 8. VALIDATE CUSTOMER-SPECIFIC DATA
    // ========================================================
    //
    // We only require a company name when the account being
    // created is a customer.
    // ========================================================

    if (!customerName) {
      return NextResponse.json(
        {
          error:
            "Customer name is required for customer accounts.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 9. CREATE THE CUSTOMER
    // ========================================================
    //
    // This is the original customer creation flow.
    // ========================================================

    const {
      data: customer,
      error: customerError,
    } = await supabaseAdmin
      .from("customers")
      .insert({
        name: customerName,
      })
      .select("id, name")
      .single();

    if (customerError || !customer) {
      console.error(
        "Customer creation error:",
        customerError
      );

      return NextResponse.json(
        {
          error:
            "Could not create customer.",
        },
        {
          status: 500,
        }
      );
    }

    // ========================================================
    // 10. CREATE CUSTOMER AUTH USER
    // ========================================================

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      console.error(
        "Auth user creation error:",
        authError
      );

      // Customer was already created.
      // Remove it to avoid incomplete data.
      await supabaseAdmin
        .from("customers")
        .delete()
        .eq("id", customer.id);

      return NextResponse.json(
        {
          error:
            authError?.message ??
            "Could not create user.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 11. CREATE CUSTOMER PROFILE
    // ========================================================

    const {
      error: newProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        full_name: fullName,
        role: "customer",
        customer_id: customer.id,
      });

    if (newProfileError) {
      console.error(
        "Profile creation error:",
        newProfileError
      );

      // Remove the Auth user because account creation
      // did not complete successfully.
      await supabaseAdmin.auth.admin.deleteUser(
        authData.user.id
      );

      // Remove the company as well.
      await supabaseAdmin
        .from("customers")
        .delete()
        .eq("id", customer.id);

      return NextResponse.json(
        {
          error:
            "Could not create customer profile.",
        },
        {
          status: 500,
        }
      );
    }

    // ========================================================
    // 12. CUSTOMER SUCCESS RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        message:
          "Customer account created successfully.",
        customer: {
          id: customer.id,
          name: customer.name,
        },
        user: {
          id: authData.user.id,
          email: authData.user.email,
          fullName,
          role: "customer",
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    // ========================================================
    // UNEXPECTED ERROR
    // ========================================================

    console.error(
      "Unexpected admin user creation error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}