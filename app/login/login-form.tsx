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

type FieldName = "firstName" | "lastName" | "email" | "password";

type FieldErrors = Partial<Record<FieldName, string>>;

function mapErrorToFields(message: string, mode: AuthMode): FieldErrors {
  const fieldErrors: FieldErrors = {};
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("first name")) {
    fieldErrors.firstName = message;
  }

  if (lowerMessage.includes("last name")) {
    fieldErrors.lastName = message;
  }

  if (lowerMessage.includes("email") || lowerMessage.includes("disposable")) {
    fieldErrors.email = message;
  }

  if (lowerMessage.includes("password")) {
    fieldErrors.password = message;
  }

  if (mode === "signin" && lowerMessage.includes("invalid login credentials")) {
    return {};
  }

  return fieldErrors;
}

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState(
    authError === "auth" ? "Authentication failed. Try again." : "",
  );
  const [isLoading, setIsLoading] = useState(false);

  function clearFieldError(field: FieldName) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setIsLoading(true);

    const supabase = createClient();

    try {
      const nextFieldErrors: FieldErrors = {};

      const emailError =
        mode === "signup" ? validateSignupEmail(email) : validateEmailFormat(email);
      if (emailError) {
        nextFieldErrors.email = emailError;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        nextFieldErrors.password = passwordError;
      }

      if (mode === "signup") {
        const firstNameError = validatePersonName(firstName, "First");
        if (firstNameError) {
          nextFieldErrors.firstName = firstNameError;
        }

        const lastNameError = validatePersonName(lastName, "Last");
        if (lastNameError) {
          nextFieldErrors.lastName = lastNameError;
        }
      }

      if (Object.keys(nextFieldErrors).length > 0) {
        const firstError = Object.values(nextFieldErrors)[0] ?? "Please fix the highlighted fields.";
        setFieldErrors(nextFieldErrors);
        throw new Error(firstError);
      }

      if (mode === "signup") {
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
      const message =
        submitError instanceof Error ? submitError.message : "Authentication failed";
      setError(message);
      setFieldErrors((current) => {
        if (Object.keys(current).length > 0) {
          return current;
        }
        return mapErrorToFields(message, mode);
      });
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
            onClick={() => {
              setMode(option);
              setFieldErrors({});
              setError("");
            }}
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
                invalid={Boolean(fieldErrors.firstName)}
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  clearFieldError("firstName");
                }}
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
                invalid={Boolean(fieldErrors.lastName)}
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value);
                  clearFieldError("lastName");
                }}
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
            invalid={Boolean(fieldErrors.email)}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearFieldError("email");
            }}
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
            invalid={Boolean(fieldErrors.password)}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearFieldError("password");
            }}
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
