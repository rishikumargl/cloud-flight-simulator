import { createFileRoute, Link } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — CloudFlight" }] }),
  component: LoginPage,
});

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <path d="M4 22 L14 4 L24 22 L18 22 L14 14 L10 22 Z" fill="var(--primary)" />
      </svg>
      <span className="text-lg font-semibold tracking-tight text-ink">cloudflight</span>
    </div>
  );
}

function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto w-full max-w-7xl px-6 py-6">
        <Link to="/"><Logo /></Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-[2.5rem] font-medium leading-tight tracking-[-0.03em] text-ink">
              Welcome back
            </h1>
            <p className="mt-2 text-[15px] text-foreground">
              Sign in to continue your cloud training missions.
            </p>
          </div>
          <div className="flex justify-center">
            <SignIn fallbackRedirectUrl="/dashboard" />
          </div>
        </div>
      </div>
      <footer className="mx-auto w-full max-w-7xl border-t border-border px-6 py-6">
        <p className="mono-label">© 2026 CLOUDFLIGHT</p>
      </footer>
    </div>
  );
}
