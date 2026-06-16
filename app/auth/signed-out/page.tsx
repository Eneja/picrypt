import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

interface SignedOutPageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function SignedOutPage({ searchParams }: SignedOutPageProps) {
  const { reason } = await searchParams;
  const inactive = reason === "inactivity";

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md space-y-5 p-6 text-center sm:p-8 sm:text-left">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {inactive ? "Session timed out" : "You've signed out"}
          </h1>
          <p className="text-sm leading-relaxed text-muted">
            {inactive
              ? "You were signed out after 10 minutes of inactivity. Saved drafts will be restored when you sign back in."
              : "Your session has ended. Sign in again when you're ready to use Picrypt."}
          </p>
        </div>
        <Link href="/login" className="inline-block w-full sm:w-auto">
          <Button type="button" className="w-full sm:min-w-[160px]">
            Go to sign in
          </Button>
        </Link>
      </Card>
    </main>
  );
}
