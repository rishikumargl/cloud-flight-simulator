import { Menu, X, Bell, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useClerk } from "@clerk/clerk-react";
import useAuthStore from "../hooks/useAuth";

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

export default function Navbar({ onMenuToggle }: { onMenuToggle?: (open: boolean) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, role } = useAuthStore();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    onMenuToggle?.(next);
  };

  const handleLogout = async () => {
    await logout();
    await signOut({ redirectUrl: "/login" });
  };

  const learnerLinks = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Missions", to: "/challenges" },
    { label: "Progress", to: "/progress" },
    { label: "History", to: "/history" },
  ];
  const adminLinks = [
    { label: "Dashboard", to: "/admin/dashboard" },
    { label: "Learners", to: "/admin/learners" },
  ];
  const navLinks = role === "ADMIN" || role === "PLATFORM_ADMIN" ? adminLinks : learnerLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Sidebar toggle */}
        <button
          onClick={toggle}
          className="mr-3 grid h-9 w-9 place-items-center rounded-lg border border-border text-foreground hover:border-primary/40 hover:text-ink"
          title="Toggle sidebar"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <Link to="/" className="mr-8">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[14px] text-foreground hover:text-ink hover:opacity-80"
              activeProps={{ className: "text-ink font-medium" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-border text-foreground hover:text-ink">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>

          {user && (
            <div className="hidden items-center gap-2 sm:flex">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt={user.name}
                className="h-8 w-8 rounded-full ring-2 ring-primary/20"
              />
              <div className="hidden lg:block">
                <div className="text-[13px] font-semibold text-ink">{user.name}</div>
                <div className="mono-label">{role === "ADMIN" ? "Admin" : "Learner"}</div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] text-foreground hover:border-red-300 hover:text-red-600 sm:flex"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {isOpen && (
        <div className="border-t border-border bg-background px-6 pb-5 pt-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-4 py-2.5 text-[14px] text-foreground hover:bg-surface hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="mt-2 flex items-center gap-2 rounded-lg px-4 py-2.5 text-[14px] text-foreground hover:bg-surface hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
