import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import keycloak from '../config/keycloak';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleKeycloakLogin = () => {
    keycloak.login();
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

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 animate-slide-down">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="font-bold text-cloud-900 text-lg">Sign In</p>
            <p className="text-sm text-cloud-600 mt-1">Access your cloud missions</p>
          </div>

          {/* Login Button */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleKeycloakLogin}
            className="w-full"
          >
            🔐 Login with Keycloak
          </Button>

          {/* Footer Links */}
          <div className="mt-8 space-y-4 text-center text-sm">
            <p className="text-cloud-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
                Sign up free
              </Link>
            </p>

            <div className="border-t border-cloud-200 pt-4">
              <p className="text-cloud-600 mb-2">Administrator?</p>
              <button
                onClick={handleKeycloakLogin}
                className="font-bold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Admin Login →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
