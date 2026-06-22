import { Home, BookOpen, TrendingUp, Users, BarChart3, X, Settings, Server, Zap, AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../hooks/useAuth';
import Logo from './ui/Logo';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { role } = useAuthStore();

  const userMenuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/challenges', icon: BookOpen, label: 'Challenges' },
    { path: '/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/history', icon: BarChart3, label: 'Mission History' },
  ];

  const adminMenuItems = [
    { path: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/admin/learners', icon: Users, label: 'Learners' },
    { path: '/admin/insights', icon: TrendingUp, label: 'Learner Insights' },
    { path: '/admin/challenges', icon: BookOpen, label: 'Challenges' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/gcp', icon: Server, label: 'GCP Environments' },
    { path: '/admin/system', icon: Zap, label: 'System Monitor' },
    { path: '/admin/tracing', icon: AlertCircle, label: 'AI Tracing' },
    { path: '/admin/logs', icon: Settings, label: 'Logs & Audit' },
    { path: '/admin/issues', icon: AlertCircle, label: 'Issues' },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:fixed top-0 left-0 h-screen bg-cloud-900 text-white w-64 z-40 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-400 rounded-lg flex items-center justify-center">
                <Logo size={18} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-lg block">CloudFlight</span>
                <span className="text-xs text-cloud-400">{role === 'admin' ? 'Admin' : 'Learner'}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-2 hover:bg-cloud-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-base ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-cloud-300 hover:bg-cloud-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-cloud-700">
          <div className="text-sm text-cloud-400">
            <p className="font-medium mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs">All Systems Operational</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
