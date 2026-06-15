import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PendingPage() {
  return (
    <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <Card className="space-y-5 p-6 sm:p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Approval pending</h1>
          <p className="text-sm leading-relaxed text-muted">
            Your account has been created and is waiting for an administrator to approve access.
            You&apos;ll be able to use Picrypt once approved.
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
