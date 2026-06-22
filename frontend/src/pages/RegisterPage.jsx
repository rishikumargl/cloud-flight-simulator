import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import useAuthStore from '../hooks/useAuth';
import Logo from '../components/ui/Logo';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
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

  const passwordStrength = formData.password.length > 0 ? Math.min((formData.password.length / 12) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl mb-8 shadow-lg border border-primary-200">
            <Logo size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-cloud-900 mb-3">Join CloudFlight</h1>
          <p className="text-cloud-600 text-lg">Start your cloud engineering journey today</p>
        </div>

        {/* Register Form Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/30">
          {/* Error Message */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-sm font-medium flex items-start gap-3 animate-slide-up">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              {errors.submit}
            </div>
          )}

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
                  errors.name ? 'border-error focus:ring-error' : 'border-cloud-200 focus:border-primary-500 focus:ring-primary-500'
                }`}
              />
              {errors.name && <p className="mt-2 text-sm text-error font-medium">{errors.name}</p>}
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
                  errors.email ? 'border-error focus:ring-error' : 'border-cloud-200 focus:border-primary-500 focus:ring-primary-500'
                }`}
              />
              {errors.email && <p className="mt-2 text-sm text-error font-medium">{errors.email}</p>}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-cloud-900 mb-2">
                Password
              </label>
              <div className="relative mb-2">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 bg-cloud-50 ${
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

              {/* Password Strength */}
              {formData.password && (
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-cloud-600">Password Strength</span>
                    <span className={`text-xs font-bold ${passwordStrength < 50 ? 'text-error' : passwordStrength < 80 ? 'text-warning' : 'text-accent-600'}`}>
                      {passwordStrength < 50 ? 'Weak' : passwordStrength < 80 ? 'Fair' : 'Strong'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-cloud-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength < 50 ? 'bg-error' : passwordStrength < 80 ? 'bg-warning' : 'bg-accent-600'}`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}

              {errors.password && <p className="mt-2 text-sm text-error font-medium">{errors.password}</p>}
            </div>

            {/* Confirm Password Input */}
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
                    errors.confirmPassword ? 'border-error focus:ring-error' : 'border-cloud-200 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cloud-400 hover:text-cloud-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Match Indicator */}
              {formData.password && formData.confirmPassword && (
                <div className={`mt-2 flex items-center gap-2 text-sm font-medium ${
                  formData.password === formData.confirmPassword ? 'text-accent-600' : 'text-error'
                }`}>
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Passwords don't match
                    </>
                  )}
                </div>
              )}

              {errors.confirmPassword && <p className="mt-2 text-sm text-error font-medium">{errors.confirmPassword}</p>}
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-cloud-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                required
                className="w-5 h-5 rounded border-2 border-cloud-300 text-primary-600 focus:ring-primary-500 cursor-pointer mt-0.5 flex-shrink-0"
              />
              <span className="text-sm text-cloud-700">
                I agree to the <a href="#" className="text-primary-600 hover:text-primary-700 font-semibold">Terms and Conditions</a> and <a href="#" className="text-primary-600 hover:text-primary-700 font-semibold">Privacy Policy</a>
              </span>
            </label>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full mt-6"
            >
              {isLoading ? '🔄 Creating account...' : '🚀 Create Account'}
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-cloud-600 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Benefits Section */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl mb-3">🎓</p>
            <p className="text-sm font-semibold text-white/90">Expert Courses</p>
          </div>
          <div className="text-center">
            <p className="text-3xl mb-3">🚀</p>
            <p className="text-sm font-semibold text-white/90">Learn Skills</p>
          </div>
          <div className="text-center">
            <p className="text-3xl mb-3">⭐</p>
            <p className="text-sm font-semibold text-white/90">Grow Faster</p>
          </div>
        </div>
      </div>
    </div>
  );
}
