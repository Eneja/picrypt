import { createClient } from "@/lib/supabase/server";
import { canAccessApp, isAdmin, type Profile } from "@/lib/profile";
import { getProfileByUserId } from "@/lib/profile-server";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getUser();
  if (!user) {
    return null;
  }

  return getProfileByUserId(user.id);
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }
  return user;
}

export async function requireApprovedUser() {
  const user = await requireUser();
  if (!user) {
    return null;
  }

  const profile = await getProfileByUserId(user.id);
  if (!profile || !canAccessApp(profile)) {
    return null;
  }

  return { user, profile };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user) {
    return null;
  }

  const profile = await getProfileByUserId(user.id);
  if (!profile || !isAdmin(profile)) {
    return null;
  }

  return { user, profile };
}
