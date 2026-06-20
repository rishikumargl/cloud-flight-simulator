import { useNavigate } from 'react-router-dom';
import useAuthStore from '../hooks/useAuth';

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const { setRole } = useAuthStore();

  const handleUserRole = () => {
    setRole('user');
    navigate('/login');
  };

  const handleAdminRole = () => {
    setRole('admin');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-2xl mb-6">
            <span className="text-5xl">☁️</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-cloud-900 mb-4">Cloud Flight Simulator</h1>
          <p className="text-lg text-cloud-600">Select your role to continue</p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* User Card */}
          <div
            onClick={handleUserRole}
            className="group cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8 border-2 border-transparent hover:border-primary-600"
          >
            <div className="text-6xl mb-6 text-center">🎓</div>
            <h2 className="text-2xl font-bold text-cloud-900 mb-4 text-center">Learner</h2>
            <p className="text-center text-cloud-600 mb-6 text-base leading-relaxed">
              Start your cloud learning journey with personalized challenges and real-time feedback.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-cloud-700 text-base">
                <span className="text-primary-600 font-bold">✓</span>
                <span>Access cloud challenges</span>
              </div>
              <div className="flex items-center gap-3 text-cloud-700 text-base">
                <span className="text-primary-600 font-bold">✓</span>
                <span>Track your progress</span>
              </div>
              <div className="flex items-center gap-3 text-cloud-700 text-base">
                <span className="text-primary-600 font-bold">✓</span>
                <span>Get AI-powered feedback</span>
              </div>
              <div className="flex items-center gap-3 text-cloud-700 text-base">
                <span className="text-primary-600 font-bold">✓</span>
                <span>Earn certificates</span>
              </div>
            </div>
            <button className="w-full bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition text-base">
              Continue as Learner
            </button>
          </div>

          {/* Admin Card */}
          <div
            onClick={handleAdminRole}
            className="group cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8 border-2 border-transparent hover:border-primary-600"
          >
            <div className="text-6xl mb-6 text-center">⚙️</div>
            <h2 className="text-2xl font-bold text-cloud-900 mb-4 text-center">Administrator</h2>
            <p className="text-center text-cloud-600 mb-6 text-base leading-relaxed">
              Manage the platform, monitor learners, and analyze system performance.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-cloud-700 text-base">
                <span className="text-primary-600 font-bold">✓</span>
                <span>Monitor learners</span>
              </div>
              <div className="flex items-center gap-3 text-cloud-700 text-base">
                <span className="text-primary-600 font-bold">✓</span>
                <span>Track challenges</span>
              </div>
              <div className="flex items-center gap-3 text-cloud-700 text-base">
                <span className="text-primary-600 font-bold">✓</span>
                <span>View analytics</span>
              </div>
              <div className="flex items-center gap-3 text-cloud-700 text-base">
                <span className="text-primary-600 font-bold">✓</span>
                <span>Audit logs</span>
              </div>
            </div>
            <button className="w-full bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition text-base">
              Continue as Admin
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center">
          <p className="text-cloud-600 text-base">
            Need help? Contact support at{' '}
            <a href="mailto:support@cloudflight.dev" className="text-primary-600 hover:text-primary-700 font-semibold">
              support@cloudflight.dev
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
