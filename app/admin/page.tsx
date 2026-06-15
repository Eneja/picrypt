import { AdminUserManagement } from "@/components/admin/user-management";
import { AppShell } from "@/components/app-shell";
import { Suspense } from "react";

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted">
          Loading…
        </div>
      }
    >
      <AppShell adminMode>
        <AdminUserManagement />
      </AppShell>
    </Suspense>
  );
}
