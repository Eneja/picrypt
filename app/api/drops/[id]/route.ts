import { NextResponse } from "next/server";
import { requireApprovedUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isValidDropId } from "@/lib/url";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApprovedUser();
  if (!auth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (!isValidDropId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("drops")
      .select("payload, expires_at")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (new Date(data.expires_at) <= new Date()) {
      await supabase.from("drops").delete().eq("id", id);
      return NextResponse.json({ error: "Expired" }, { status: 410 });
    }

    return NextResponse.json({ payload: data.payload });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
