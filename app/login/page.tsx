import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <Suspense fallback={<div className="text-sm text-neutral-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
