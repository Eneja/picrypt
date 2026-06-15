"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Profile, ProfileStatus } from "@/lib/profile";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";

type Filter = "pending" | "all";

function StatusBadge({ status }: { status: ProfileStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        status === "approved" && "bg-accent-soft text-foreground",
        status === "pending" && "bg-background text-muted",
        status === "rejected" && "bg-danger-soft text-danger",
      )}
    >
      {status}
    </span>
  );
}

export function AdminUserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProfiles() {
      try {
        const response = await fetch("/api/admin/users");
        if (!response.ok) {
          throw new Error("Failed to load users");
        }

        const data = (await response.json()) as { profiles: Profile[] };
        if (!cancelled) {
          setProfiles(data.profiles);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load users");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfiles();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function updateUser(id: string, body: { status?: ProfileStatus; role?: "admin" | "user" }) {
    setUpdatingId(id);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to update user");
      }

      setRefreshKey((current) => current + 1);
      setLoading(true);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update user");
    } finally {
      setUpdatingId(null);
    }
  }

  const visibleProfiles =
    filter === "pending" ? profiles.filter((profile) => profile.status === "pending") : profiles;

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">User access</h2>
          <p className="text-sm text-muted">Approve or reject sign-up requests.</p>
        </div>
        <div className="flex gap-2">
          {(["pending", "all"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                filter === option
                  ? "border-accent bg-accent-soft text-foreground"
                  : "border-border bg-surface text-muted hover:text-foreground",
              )}
            >
              {option === "pending" ? "Pending" : "All users"}
            </button>
          ))}
        </div>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {loading ? (
        <p className="text-sm text-muted">Loading users…</p>
      ) : visibleProfiles.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted">
            {filter === "pending" ? "No pending sign-ups." : "No users found."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleProfiles.map((profile) => (
            <Card key={profile.id} className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{profile.email}</p>
                  <p className="text-xs text-muted">
                    Joined {new Date(profile.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={profile.status} />
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize text-muted">
                    {profile.role}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.status !== "approved" ? (
                  <Button
                    type="button"
                    disabled={updatingId === profile.id}
                    onClick={() => updateUser(profile.id, { status: "approved" })}
                  >
                    Approve
                  </Button>
                ) : null}
                {profile.status !== "rejected" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={updatingId === profile.id}
                    onClick={() => updateUser(profile.id, { status: "rejected" })}
                  >
                    Reject
                  </Button>
                ) : null}
                {profile.status === "approved" && profile.role !== "admin" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={updatingId === profile.id}
                    onClick={() => updateUser(profile.id, { role: "admin" })}
                  >
                    Make admin
                  </Button>
                ) : null}
                {profile.role === "admin" && profile.status === "approved" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={updatingId === profile.id}
                    onClick={() => updateUser(profile.id, { role: "user" })}
                  >
                    Remove admin
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
