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
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50/30 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="space-y-4 mb-8 text-center">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
              <Logo size={24} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-cloud-900 mb-1">CloudFlight</h1>
            <p className="text-orange-600 font-semibold">Sign In to Your Account</p>
          </div>
          <p className="text-cloud-600 text-sm">Access your cloud missions and continue learning</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-cloud-200 to-transparent mb-8"></div>

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-start gap-2">
            <span>⚠️</span>
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Login Form */}
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
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 bg-cloud-50 ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-cloud-200 focus:border-orange-500 focus:ring-orange-500'
              }`}
            />
            {errors.email && <p className="mt-2 text-sm text-red-600 font-medium">{errors.email}</p>}
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
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 bg-cloud-50 ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-cloud-200 focus:border-orange-500 focus:ring-orange-500'
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
            {errors.password && <p className="mt-2 text-sm text-red-600 font-medium">{errors.password}</p>}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-sm text-cloud-700 cursor-pointer hover:text-orange-600 transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-cloud-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <span className="font-medium">Remember me</span>
            </label>
            <Link to="#" className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            className="w-full mt-8 gap-2"
          >
            {isLoading ? '🔄 Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Admin Login Button */}
        <Button
          onClick={() => navigate('/admin/login')}
          variant="secondary"
          size="lg"
          className="w-full mt-4 gap-2"
        >
          Sign In as Administrator
        </Button>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-cloud-200 to-transparent my-8"></div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-cloud-600 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-orange-600 hover:text-orange-700 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
