import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Profile, ProfileRole, ProfileStatus } from "@/lib/profile";

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error || !data) {
    return null;
  }

  return data as Profile;
}

export async function listProfiles(): Promise<Profile[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Profile[];
}

export async function updateProfileStatus(
  userId: string,
  status: ProfileStatus,
  adminId: string,
): Promise<Profile> {
  const supabase = getSupabaseAdmin();
  const updates: Record<string, string | null> = {
    status,
    approved_at: status === "approved" ? new Date().toISOString() : null,
    approved_by: status === "approved" ? adminId : null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update profile");
  }

  return data as Profile;
}

export async function updateProfileRole(
  userId: string,
  role: ProfileRole,
): Promise<Profile> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update role");
  }

  return data as Profile;
}

export async function syncAdminBootstrap(userId: string, email: string): Promise<Profile | null> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || email.trim().toLowerCase() !== adminEmail) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      role: "admin",
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: userId,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return data as Profile;
}
