import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isValidDropId } from "@/lib/url";

const MAX_PAYLOAD_LENGTH = 16 * 1024;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, payload, expiresAt } = body;

    if (!isValidDropId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    if (
      typeof payload !== "string" ||
      payload.length === 0 ||
      payload.length > MAX_PAYLOAD_LENGTH ||
      !BASE64URL_PATTERN.test(payload)
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const expires = new Date(expiresAt);
    if (Number.isNaN(expires.getTime()) || expires <= new Date()) {
      return NextResponse.json({ error: "Invalid expiry" }, { status: 400 });
    }

    const maxExpiry = new Date();
    maxExpiry.setDate(maxExpiry.getDate() + 30);
    if (expires > maxExpiry) {
      return NextResponse.json({ error: "Expiry too far in the future" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("drops").insert({
      id,
      payload,
      expires_at: expires.toISOString(),
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Drop already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
