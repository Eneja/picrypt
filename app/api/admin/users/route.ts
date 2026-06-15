import { requireAdmin } from "@/lib/auth";
import { listProfiles } from "@/lib/profile-server";
import { NextResponse } from "next/server";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const profiles = await listProfiles();
    return NextResponse.json({ profiles });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list users" },
      { status: 500 },
    );
  }
}
