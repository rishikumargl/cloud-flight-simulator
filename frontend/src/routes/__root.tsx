import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { setApiTokenGetter } from "../api/client";
import useAuthStore from "../hooks/useAuth";
import api from "../api/client";
import { CLERK_PUBLISHABLE_KEY } from "../config/clerk";

// ─── 404 ──────────────────────────────────────────────────────────
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-display text-7xl font-medium text-ink">404</div>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-[14px] text-foreground/60">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary mt-6 inline-block">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "root" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
        <p className="mt-2 text-[14px] text-foreground/60">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-primary">Try again</button>
          <a href="/" className="btn-ghost">Go home</a>
        </div>
      </div>
    </div>
  );
}

// ─── Auth initializer ──────────────────────────────────────────────
function AuthInitializer({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const { setUser, setAuthenticated, setRole } = useAuthStore();

  useEffect(() => {
    // Always keep the token getter registered so the Axios interceptor works
    setApiTokenGetter(getToken);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setAuthenticated(false);
      return;
    }

    (async () => {
      try {
        // Get token FIRST, inject manually to guarantee it's present
        // (avoids race condition where interceptor runs before setApiTokenGetter)
        const token = await getToken();
        console.log("[AUTH] Token obtained:", !!token, token?.slice(0, 20) + "...");

        if (!token) {
          throw new Error("Clerk returned null token");
        }

        console.log("[AUTH] Calling GET /auth/me ...");
        const response = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` }, // explicit, no race condition
        });

        const user = response.data;
        console.log("[AUTH] /auth/me response:", user);

        setUser({
          id: user.user_id,
          email: user.email,
          name: user.full_name,
          avatar: clerkUser?.imageUrl,
        });
        setRole(user.role);
        setAuthenticated(true);

      } catch (err: any) {
        const status = err?.response?.status;
        const detail = err?.response?.data?.detail ?? err?.message;
        console.error(`[AUTH] /auth/me failed — ${status}:`, detail);

        // Fallback: use Clerk data directly so UI doesn't break
        // but DB won't be synced — user will see this in console
        if (clerkUser) {
          console.warn("[AUTH] Falling back to Clerk-only data (DB not synced)");
          setUser({
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
            name: clerkUser.fullName ?? clerkUser.firstName ?? "User",
            avatar: clerkUser.imageUrl,
          });
          setRole("LEARNER");
          setAuthenticated(true);
        }
      }
    })();
  }, [isSignedIn, isLoaded]);

  return <>{children}</>;
}

// ─── Root route ────────────────────────────────────────────────────
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CloudFlight — Cloud skills that ship to production" },
      { name: "description", content: "AI-native cloud training platform with live GCP environments." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>
          <Outlet />
        </AuthInitializer>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
