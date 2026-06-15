import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RejectedPage() {
  return (
    <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <Card className="space-y-5 p-6 sm:p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Access not approved</h1>
          <p className="text-sm leading-relaxed text-muted">
            Your sign-up request was not approved. Contact an administrator if you believe this
            is a mistake.
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      </Card>
    </main>
  );
}
