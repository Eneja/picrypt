"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { validateEmailFormat, validateSignupEmail } from "@/lib/email-validation";
import { cn } from "@/lib/cn";
import { validatePersonName } from "@/lib/name-validation";
import { validatePassword } from "@/lib/password-validation";
import { createClient } from "@/lib/supabase/client";
import type { ProfileStatus } from "@/lib/profile";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type AuthMode = "signin" | "signup";

async function redirectAfterAuth(
  router: ReturnType<typeof useRouter>,
  nextPath: string | null,
) {
  const syncResponse = await fetch("/api/auth/sync-profile", { method: "POST" });
  if (!syncResponse.ok) {
    router.push("/pending");
    router.refresh();
    return;
  }

  const data = (await syncResponse.json()) as {
    profile?: { status: ProfileStatus };
  };

  if (data.profile?.status === "pending") {
    router.push("/pending");
  } else if (data.profile?.status === "rejected") {
    router.push("/rejected");
  } else {
    router.push(nextPath ?? "/");
  }

  router.refresh();
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  const [mode, setMode] = useState<AuthMode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    authError === "auth" ? "Authentication failed. Try again." : "",
  );
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = createClient();

    try {
      const emailError =
        mode === "signup" ? validateSignupEmail(email) : validateEmailFormat(email);
      if (emailError) {
        throw new Error(emailError);
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      if (mode === "signup") {
        const firstNameError = validatePersonName(firstName, "First");
        if (firstNameError) {
          throw new Error(firstNameError);
        }

        const lastNameError = validatePersonName(lastName, "Last");
        if (lastNameError) {
          throw new Error(lastNameError);
        }

        const signupResponse = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, firstName, lastName }),
        });

        if (!signupResponse.ok) {
          const data = (await signupResponse.json()) as { error?: string };
          throw new Error(data.error ?? "Sign-up failed");
        }

        const signInResult = await supabase.auth.signInWithPassword({ email, password });
        if (signInResult.error) {
          throw signInResult.error;
        }
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) {
          throw result.error;
        }
      }

      await redirectAfterAuth(router, searchParams.get("next"));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md space-y-6 p-6 sm:p-8">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Picrypt
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          {mode === "signup"
            ? "Create an account with your name and an email address."
            : "Sign in with your email and password. Contact admin if you need assistance."}
        </p>
      </div>

      <div
        className="flex gap-2 rounded-lg border border-border bg-background p-1"
        role="group"
        aria-label="Authentication mode"
      >
        {(["signin", "signup"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={mode === option}
            onClick={() => setMode(option)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors motion-safe:duration-200",
              mode === option
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            {option === "signin" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === "signup" ? (
          <>
            <div className="space-y-2">
              <label htmlFor="first-name" className="text-sm font-medium text-foreground">
                First name
              </label>
              <Input
                id="first-name"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="last-name" className="text-sm font-medium text-foreground">
                Last name
              </label>
              <Input
                id="last-name"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {mode === "signup" ? (
            <p className="text-xs text-muted">Temporary or disposable email addresses are not allowed.</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className="text-xs text-muted">Must be at least 8 characters.</p>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          {isLoading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      {error ? <Alert variant="error">{error}</Alert> : null}
    </Card>
  );
}
