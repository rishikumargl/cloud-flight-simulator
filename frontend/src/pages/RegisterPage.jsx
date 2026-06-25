import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import useAuthStore from '../hooks/useAuth';
import Logo from '../components/ui/Logo';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
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
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-b from-white via-sky-50/30 to-white flex items-center justify-center p-4 overflow-x-hidden">
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
            <p className="text-orange-600 font-semibold">Create Your Account</p>
          </div>
          <p className="text-cloud-600 text-sm">Start your cloud engineering journey today</p>
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

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-cloud-900 mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 bg-cloud-50 ${
                errors.name
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-cloud-200 focus:border-orange-500 focus:ring-orange-500'
              }`}
            />
            {errors.name && <p className="mt-2 text-sm text-red-600 font-medium">{errors.name}</p>}
          </div>

          {/* Email Input */}
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

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-cloud-900 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 bg-cloud-50 ${
                errors.password
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-cloud-200 focus:border-orange-500 focus:ring-orange-500'
              }`}
            />
            {errors.password && <p className="mt-2 text-sm text-red-600 font-medium">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-cloud-900 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 bg-cloud-50 ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-cloud-200 focus:border-orange-500 focus:ring-orange-500'
                }`}
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <CheckCircle2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-600" />
              )}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cloud-400 hover:text-cloud-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-2 text-sm text-red-600 font-medium">{errors.confirmPassword}</p>}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            className="w-full mt-8 gap-2"
          >
            {isLoading ? '🔄 Creating account...' : 'Create Account'}
          </Button>
        </form>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-cloud-200 to-transparent my-8"></div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-cloud-600 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-orange-600 hover:text-orange-700 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
