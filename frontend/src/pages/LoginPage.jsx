import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import useAuthStore from '../hooks/useAuth';
import Logo from '../components/ui/Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: 'demo@example.com',
    password: 'password123',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await login(formData.email, formData.password, 'user');
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: error.message || 'Login failed. Please check your credentials.' });
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl mb-4 shadow-lg border border-primary-200">
            <Logo size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-cloud-900 mb-2">Cloud Flight Simulator</h1>
          <p className="text-cloud-600">Master cloud computing through interactive challenges</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 animate-slide-down">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="font-bold text-cloud-900 text-lg">Learner Login</p>
            <p className="text-sm text-cloud-600 mt-1">Sign in to access your cloud missions</p>
          </div>

            {errors.submit && (
              <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-sm font-medium animate-slide-up">
                ❌ {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-cloud-900 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 bg-white/50 ${
                  errors.email ? 'border-error focus:ring-error' : 'border-cloud-200 focus:border-primary-500 focus:ring-primary-500'
                }`}
              />
              {errors.email && <p className="mt-2 text-sm text-error font-medium">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-cloud-900 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 bg-white/50 ${
                    errors.password ? 'border-error focus:ring-error' : 'border-cloud-200 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cloud-400 hover:text-cloud-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-sm text-error font-medium">{errors.password}</p>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-sm text-cloud-700 cursor-pointer hover:text-primary-600 transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-cloud-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <span className="font-medium">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Forgot password?
              </a>
            </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full mt-6"
              >
                {isLoading ? '🔄 Signing in...' : '🚀 Sign In'}
              </Button>
            </form>

          {/* Links */}
          <div className="mt-8 space-y-4 text-center text-sm">
            <p className="text-cloud-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
                Create one free
              </Link>
            </p>

            <div className="border-t border-cloud-200 pt-4">
              <p className="text-cloud-600 mb-2">Admin?</p>
              <a
                href="/admin/login"
                className="font-bold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Admin Login →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
