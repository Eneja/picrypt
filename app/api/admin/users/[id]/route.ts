import { requireAdmin } from "@/lib/auth";
import {
  getProfileByUserId,
  updateProfileRole,
  updateProfileStatus,
  wouldRemoveLastAdmin,
} from "@/lib/profile-server";
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

    if (id === admin.user.id) {
      if (role === "user") {
        return NextResponse.json(
          { error: "You cannot remove your own admin access." },
          { status: 400 },
        );
      }

      return NextResponse.json({ error: "You cannot modify your own account here." }, { status: 400 });
    }

    if (await wouldRemoveLastAdmin(id, { status, role })) {
      return NextResponse.json(
        { error: "At least one admin account is required. Promote another admin first." },
        { status: 400 },
      );
    }

    const target = await getProfileByUserId(id);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
