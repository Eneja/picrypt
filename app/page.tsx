"use client";

import { AppShell } from "@/components/app-shell";
import { Suspense } from "react";

function HomeContent() {
  return <AppShell />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted">
          Loading…
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
