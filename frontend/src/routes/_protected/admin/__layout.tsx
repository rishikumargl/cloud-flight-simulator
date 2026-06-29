import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BarChart3, Activity, Users, AlertTriangle, Zap, Settings } from "lucide-react";

export const Route = createFileRoute("/_protected/admin/__layout")({
  head: () => ({ meta: [{ title: "Admin — Operations" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const navItems = [
    { to: "/admin/dashboard", label: "Operations Center", icon: <Activity className="h-4 w-4" /> },
    { to: "/admin/sessions", label: "Live Sessions", icon: <Zap className="h-4 w-4" /> },
    { to: "/admin/missions", label: "Mission Quality", icon: <BarChart3 className="h-4 w-4" /> },
    { to: "/admin/learners", label: "Learner Intelligence", icon: <Users className="h-4 w-4" /> },
    { to: "/admin/failures", label: "Failure Analytics", icon: <AlertTriangle className="h-4 w-4" /> },
    { to: "/admin/policy", label: "Enterprise Policy", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin navigation sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-surface p-6 z-40 hidden lg:block">
        <div className="mb-8">
          <h2 className="font-display text-[16px] font-semibold text-ink mb-1">Admin Panel</h2>
          <p className="text-[12px] text-foreground">Operations & Analytics</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "bg-primary/10 text-primary" }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-medium text-foreground hover:bg-muted transition"
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile navigation tabs */}
      <div className="sticky top-0 lg:hidden border-b border-border bg-surface z-30 overflow-x-auto">
        <div className="flex gap-1 px-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "border-b-2 border-primary text-primary" }}
              className="flex items-center gap-1 px-3 py-2 text-[12px] font-medium text-foreground hover:text-primary transition whitespace-nowrap"
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 p-6 md:p-8">
        <Outlet />
      </div>
    </div>
  );
}
