import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import useAuthStore from "../hooks/useAuth";

export const Route = createFileRoute("/_protected")({
  component: ProtectedLayout,
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { isAuthenticated } = useAuthStore();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="mono-label">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    window.location.href = "/login";
    return null;
  }

  return <>{children}</>;
}

function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-col">
          <Navbar onMenuToggle={setSidebarOpen} />
          <main className="mx-auto w-full max-w-7xl px-6 py-10">
            <Outlet />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
