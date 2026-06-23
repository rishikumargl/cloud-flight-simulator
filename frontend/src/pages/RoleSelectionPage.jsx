import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';

export default function RoleSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl mb-8 shadow-lg border border-primary-200">
          <Logo size={40} className="text-white" />
        </div>

        {/* Main Content */}
        <h1 className="text-5xl md:text-6xl font-bold text-cloud-900 mb-4">Cloud Flight Simulator</h1>
        <p className="text-xl text-cloud-600 mb-10 max-w-xl mx-auto leading-relaxed">
          Master cloud computing through interactive AI-powered challenges, real-time feedback, and hands-on learning experiences.
        </p>

        {/* CTA Button */}
        <Button
          onClick={() => navigate('/login')}
          variant="primary"
          size="lg"
          className="gap-2 mb-12"
        >
          Get Started →
        </Button>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-primary-50 to-sky-50 rounded-2xl p-6 border border-primary-200 hover:shadow-lg transition">
            <span className="text-4xl mb-3 block">🎓</span>
            <h3 className="text-cloud-900 font-bold mb-2">Learn</h3>
            <p className="text-cloud-600 text-sm">Access 6+ cloud learning tracks</p>
          </div>
          <div className="bg-gradient-to-br from-primary-50 to-sky-50 rounded-2xl p-6 border border-primary-200 hover:shadow-lg transition">
            <span className="text-4xl mb-3 block">⚡</span>
            <h3 className="text-cloud-900 font-bold mb-2">Practice</h3>
            <p className="text-cloud-600 text-sm">Real-world cloud scenarios</p>
          </div>
          <div className="bg-gradient-to-br from-primary-50 to-sky-50 rounded-2xl p-6 border border-primary-200 hover:shadow-lg transition">
            <span className="text-4xl mb-3 block">🎯</span>
            <h3 className="text-cloud-900 font-bold mb-2">Grow</h3>
            <p className="text-cloud-600 text-sm">AI-powered feedback instantly</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-cloud-600 text-sm">
          Need help?{' '}
          <a href="mailto:support@cloudflight.dev" className="text-primary-600 font-bold hover:text-primary-700 transition underline">
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}
