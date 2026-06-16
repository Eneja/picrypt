"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { ComposePanel } from "@/components/compose-panel";
import { UnlockPanel } from "@/components/unlock-panel";
import { Button } from "@/components/ui/button";
import { Tabs, type AppTab } from "@/components/ui/tabs";
import { isAdmin } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function getActiveTab(tabParam: string | null): AppTab {
  return tabParam === "unlock" ? "unlock" : "compose";
}

interface AppShellProps {
  adminMode?: boolean;
  children?: React.ReactNode;
}

export function AppShell({ adminMode = false, children }: AppShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = getActiveTab(searchParams.get("tab"));
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showAdminLink, setShowAdminLink] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.auth.getUser(),
      supabase.from("profiles").select("role, status").maybeSingle(),
    ]).then(([{ data: authData }, { data: profile }]) => {
      setUserEmail(authData.user?.email ?? null);
      setShowAdminLink(Boolean(profile && isAdmin(profile)));
    });
  }, []);

  function handleTabChange(tab: AppTab) {
    router.replace(`/?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
      <header className="border-b border-border pt-8 pb-0">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {adminMode ? "Admin" : "Picrypt"}
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              {adminMode
                ? "Manage user access and approvals."
                : "Built for when communication is difficult."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {showAdminLink && !adminMode ? (
              <Link href="/admin">
                <Button type="button" variant="ghost" className="px-3 py-2 text-sm">
                  Admin
                </Button>
              </Link>
            ) : null}
            {adminMode ? (
              <Link href="/">
                <Button type="button" variant="ghost" className="px-3 py-2 text-sm">
                  Back to app
                </Button>
              </Link>
            ) : null}
            {userEmail ? (
              <span
                className="hidden max-w-[180px] truncate text-sm text-muted sm:inline"
                title={userEmail}
              >
                {userEmail}
              </span>
            ) : null}
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" className="px-3 py-2 text-sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        {!adminMode ? <Tabs activeTab={activeTab} onTabChange={handleTabChange} /> : null}
      </header>

      <main>
        {adminMode ? children : activeTab === "compose" ? <ComposePanel /> : <UnlockPanel />}
      </main>
    </div>
  );
}
