import { validateSignupEmail } from "@/lib/email-validation";
import { normalizePersonName, validatePersonName } from "@/lib/name-validation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
    };

    const emailError = validateSignupEmail(email ?? "");
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    const firstNameError = validatePersonName(firstName ?? "", "First");
    if (firstNameError) {
      return NextResponse.json({ error: firstNameError }, { status: 400 });
    }

    const lastNameError = validatePersonName(lastName ?? "", "Last");
    if (lastNameError) {
      return NextResponse.json({ error: lastNameError }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const normalizedEmail = email!.trim().toLowerCase();
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: normalizePersonName(firstName!),
        last_name: normalizePersonName(lastName!),
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 },
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid sign-up request." }, { status: 400 });
  }
}
