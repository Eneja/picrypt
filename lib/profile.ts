export type ProfileRole = "admin" | "user";
export type ProfileStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: ProfileRole;
  status: ProfileStatus;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export function getProfileDisplayName(profile: Pick<Profile, "first_name" | "last_name" | "email">) {
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return fullName || profile.email;
}

export function isApproved(profile: Pick<Profile, "status">) {
  return profile.status === "approved";
}

export function isAdmin(profile: Pick<Profile, "role" | "status">) {
  return profile.role === "admin" && profile.status === "approved";
}

export function canAccessApp(profile: Pick<Profile, "status">) {
  return profile.status === "approved";
}
