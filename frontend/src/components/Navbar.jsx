import { Menu, X, LogOut, Bell, Home } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../hooks/useAuth';
import Logo from './ui/Logo';

export default function Navbar({ onMenuToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, role } = useAuthStore();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    onMenuToggle?.(!isOpen);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-cloud-100 sticky top-0 z-40 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Menu Button */}
          <button onClick={toggleMenu} className="p-2 hover:bg-cloud-100 rounded-lg transition-colors mr-2" title="Toggle menu">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
              <Logo size={20} className="text-white" />
            </div>
            <span className="hidden sm:inline text-cloud-900 font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              CloudFlight
            </span>
          </Link>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 text-cloud-700 hover:bg-cloud-100 rounded-lg transition-colors group">
              <Bell className="w-5 h-5 group-hover:text-primary-600 transition-colors" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full animate-pulse"></span>
            </button>

            {/* User Profile */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cloud-50 transition-colors">
              {user && (
                <>
                  <img
                    src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-primary-100"
                  />
                  <div className="hidden lg:block text-sm">
                    <div className="font-semibold text-cloud-900">{user.name}</div>
                    <div className="text-xs text-cloud-500">{role === 'admin' ? 'Admin' : 'Learner'}</div>
                  </div>
                </>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-cloud-600 hover:text-error hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </nav>
  );
}
