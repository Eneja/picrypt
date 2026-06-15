import { requireAdmin } from "@/lib/auth";
import { updateProfileRole, updateProfileStatus } from "@/lib/profile-server";
import type { ProfileRole, ProfileStatus } from "@/lib/profile";
import { NextResponse } from "next/server";

const VALID_STATUSES: ProfileStatus[] = ["pending", "approved", "rejected"];
const VALID_ROLES: ProfileRole[] = ["admin", "user"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === admin.user.id) {
    return NextResponse.json({ error: "You cannot modify your own account here" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status, role } = body as { status?: ProfileStatus; role?: ProfileRole };

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (!status && !role) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    let profile = null;

    if (status) {
      profile = await updateProfileStatus(id, status, admin.user.id);
    }

    if (role) {
      profile = await updateProfileRole(id, role);
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update user" },
      { status: 500 },
    );
  }
}
