import {
  Home,
  BookOpen,
  TrendingUp,
  BarChart3,
  Users,
  Server,
  Zap,
  AlertCircle,
  Settings,
  X,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import useAuthStore from "../hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
        <path d="M4 22 L14 4 L24 22 L18 22 L14 14 L10 22 Z" fill="var(--primary)" />
      </svg>
      <span className="text-base font-semibold tracking-tight text-white">cloudflight</span>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { pathname } = useRouterState({ select: (s) => s.location });
  const { role } = useAuthStore();

  const learnerItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/challenges", icon: BookOpen, label: "Challenges" },
    { path: "/progress", icon: TrendingUp, label: "Progress" },
    { path: "/history", icon: BarChart3, label: "Mission History" },
    { path: "/recommendations", icon: Zap, label: "Recommendations" },
  ];

  const adminItems = [
    { path: "/admin/dashboard", icon: Home, label: "Dashboard" },
    { path: "/admin/learners", icon: Users, label: "Learners" },
    { path: "/admin/insights", icon: TrendingUp, label: "Learner Insights" },
    { path: "/admin/challenges", icon: BookOpen, label: "Challenges" },
    { path: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/admin/gcp", icon: Server, label: "GCP Environments" },
    { path: "/admin/system", icon: Zap, label: "System Monitor" },
    { path: "/admin/tracing", icon: AlertCircle, label: "AI Tracing" },
    { path: "/admin/logs", icon: Settings, label: "Logs & Audit" },
    { path: "/admin/issues", icon: AlertCircle, label: "Issues" },
  ];

  const items = role === "ADMIN" || role === "PLATFORM_ADMIN" ? adminItems : learnerItems;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform bg-ink text-white transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <Logo />
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Role pill */}
          <div className="mono-label mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 !text-white/60">
            {role === "ADMIN" || role === "PLATFORM_ADMIN" ? "Admin" : "Learner"}
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] transition-colors ${
                    active
                      ? "bg-primary font-medium text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="mono-label !text-white/40">System Status</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-[12px] text-white/60">All Systems Operational</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
