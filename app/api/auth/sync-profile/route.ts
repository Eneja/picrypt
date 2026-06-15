import { getUser } from "@/lib/auth";
import { getProfileByUserId, syncAdminBootstrap } from "@/lib/profile-server";
import { NextResponse } from "next/server";

export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.email) {
    await syncAdminBootstrap(user.id, user.email);
  }

  const profile = await getProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
