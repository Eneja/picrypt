"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { isAdmin } from "@/lib/profile";
import type { Profile, ProfileStatus } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";

type Filter = "pending" | "all";

type AdminAction = "approve" | "reject" | "make_admin" | "remove_admin";

interface PendingAction {
  profile: Profile;
  action: AdminAction;
}

const actionCopy: Record<
  AdminAction,
  {
    title: string;
    description: (email: string) => string;
    confirmLabel: string;
    confirmVariant: "primary" | "secondary";
  }
> = {
  approve: {
    title: "Approve this user?",
    description: (email) =>
      `${email} will be able to sign in and use Picrypt to create and unlock encrypted links.`,
    confirmLabel: "Yes, approve",
    confirmVariant: "primary",
  },
  reject: {
    title: "Reject this user?",
    description: (email) =>
      `${email} will not be able to use Picrypt. They will see a message that their account was not approved.`,
    confirmLabel: "Yes, reject",
    confirmVariant: "secondary",
  },
  make_admin: {
    title: "Make this user an admin?",
    description: (email) =>
      `${email} will be able to approve or reject sign-ups and manage user access in the admin portal.`,
    confirmLabel: "Yes, make admin",
    confirmVariant: "primary",
  },
  remove_admin: {
    title: "Remove admin access?",
    description: (email) =>
      `${email} will stay an approved user, but will no longer be able to manage other users.`,
    confirmLabel: "Yes, remove admin",
    confirmVariant: "secondary",
  },
};

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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

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

      setPendingAction(null);
      setRefreshKey((current) => current + 1);
      setLoading(true);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update user");
    } finally {
      setUpdatingId(null);
    }
  }

  function openConfirm(profile: Profile, action: AdminAction) {
    setPendingAction({ profile, action });
  }

  async function handleConfirmAction() {
    if (!pendingAction) {
      return;
    }

    const { profile, action } = pendingAction;

    if (action === "approve") {
      await updateUser(profile.id, { status: "approved" });
      return;
    }

    if (action === "reject") {
      await updateUser(profile.id, { status: "rejected" });
      return;
    }

    if (action === "make_admin") {
      await updateUser(profile.id, { role: "admin" });
      return;
    }

    await updateUser(profile.id, { role: "user" });
  }

  const visibleProfiles =
    filter === "pending" ? profiles.filter((profile) => profile.status === "pending") : profiles;

  const approvedAdminCount = profiles.filter(
    (profile) => isAdmin(profile),
  ).length;

  const dialogCopy = pendingAction ? actionCopy[pendingAction.action] : null;

  return (
    <>
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
            {visibleProfiles.map((profile) => {
              const isSelf = profile.id === currentUserId;
              const isLastAdmin = isAdmin(profile) && approvedAdminCount <= 1;
              const canRemoveAdmin = isAdmin(profile) && !isSelf && !isLastAdmin;
              const canReject = profile.status !== "rejected" && !isSelf && !isLastAdmin;

              return (
              <Card key={profile.id} className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{profile.email}</p>
                      {isSelf ? (
                        <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-foreground">
                          You
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted">
                      Joined {new Date(profile.created_at).toLocaleString()}
                    </p>
                    {isSelf ? (
                      <p className="text-xs text-muted">
                        You cannot remove your own admin access.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={profile.status} />
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize text-muted">
                      {profile.role}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!isSelf && profile.status !== "approved" ? (
                    <Button
                      type="button"
                      disabled={updatingId === profile.id}
                      onClick={() => openConfirm(profile, "approve")}
                    >
                      Approve
                    </Button>
                  ) : null}
                  {canReject ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={updatingId === profile.id}
                      onClick={() => openConfirm(profile, "reject")}
                    >
                      Reject
                    </Button>
                  ) : null}
                  {!isSelf && profile.status === "approved" && profile.role !== "admin" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={updatingId === profile.id}
                      onClick={() => openConfirm(profile, "make_admin")}
                    >
                      Make admin
                    </Button>
                  ) : null}
                  {canRemoveAdmin ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={updatingId === profile.id}
                      onClick={() => openConfirm(profile, "remove_admin")}
                    >
                      Remove admin
                    </Button>
                  ) : null}
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {pendingAction && dialogCopy ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open && !updatingId) {
              setPendingAction(null);
            }
          }}
          title={dialogCopy.title}
          description={dialogCopy.description(pendingAction.profile.email)}
          confirmLabel={dialogCopy.confirmLabel}
          confirmVariant={dialogCopy.confirmVariant}
          isLoading={updatingId === pendingAction.profile.id}
          onConfirm={handleConfirmAction}
        />
      ) : null}
    </>
  );
}
