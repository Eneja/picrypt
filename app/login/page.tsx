import LoginForm from "./login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
