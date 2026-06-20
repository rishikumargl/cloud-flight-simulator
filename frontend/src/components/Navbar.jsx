import { Menu, X, LogOut, Bell } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../hooks/useAuth';

export default function Navbar({ onMenuToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, role } = useAuthStore();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    onMenuToggle?.(!isOpen);
  };

  return (
    <nav className="bg-white border-b border-cloud-100 sticky top-0 z-40 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
              ☁️
            </div>
            <span className="text-primary-600">CloudFlight</span>
          </Link>

          {/* Desktop Menu - Only for Users */}
          {role !== 'admin' && (
            <div className="hidden md:flex items-center gap-8">
              <Link to="/dashboard" className="text-cloud-700 hover:text-primary-600 transition">
                Dashboard
              </Link>
              <Link to="/challenges" className="text-cloud-700 hover:text-primary-600 transition">
                Challenges
              </Link>
              <Link to="/progress" className="text-cloud-700 hover:text-primary-600 transition">
                Progress
              </Link>
            </div>
          )}

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-cloud-100 rounded-lg transition">
              <Bell className="w-5 h-5 text-cloud-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="hidden sm:flex items-center gap-3">
              {user && (
                <>
                  <img
                    src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-cloud-900">{user.name}</div>
                    <div className="text-xs text-cloud-500">{user.email}</div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-cloud-700 hover:bg-cloud-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Menu Button */}
            <button onClick={toggleMenu} className="md:hidden p-2 hover:bg-cloud-100 rounded-lg transition">
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Only for Users */}
        {isOpen && role !== 'admin' && (
          <div className="md:hidden pb-4 border-t border-cloud-100 pt-4">
            <Link
              to="/dashboard"
              className="block px-4 py-2 text-cloud-700 hover:bg-cloud-100 rounded-lg transition"
            >
              Dashboard
            </Link>
            <Link
              to="/challenges"
              className="block px-4 py-2 text-cloud-700 hover:bg-cloud-100 rounded-lg transition"
            >
              Challenges
            </Link>
            <Link
              to="/progress"
              className="block px-4 py-2 text-cloud-700 hover:bg-cloud-100 rounded-lg transition"
            >
              Progress
            </Link>
            <button
              onClick={logout}
              className="w-full mt-4 px-4 py-2 text-left text-cloud-700 hover:bg-cloud-100 rounded-lg transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}

        {/* Mobile Logout for Admin */}
        {isOpen && role === 'admin' && (
          <div className="md:hidden pb-4 border-t border-cloud-100 pt-4">
            <button
              onClick={logout}
              className="w-full px-4 py-2 text-left text-cloud-700 hover:bg-cloud-100 rounded-lg transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
