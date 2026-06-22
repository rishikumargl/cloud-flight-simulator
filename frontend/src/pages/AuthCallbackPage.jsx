import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import keycloak from '../config/keycloak';
import useAuthStore from '../hooks/useAuth';
import api from '../api/client';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setRole = useAuthStore((state) => state.setRole);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // keycloak-js handles OIDC callback automatically
        const authenticated = await keycloak.init({
          onLoad: 'login-required',
          checkLoginIframe: false
        });

        if (authenticated) {
          // Call backend /auth/me to get user data and provision user
          const response = await api.get('/auth/me');
          const user = response.data.data;

          // Store user in Zustand
          setUser({
            id: user.user_id,
            email: user.email,
            name: user.full_name
          });
          setRole(user.role);
          setAuthenticated(true);

          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          // Not authenticated, redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        navigate('/login');
      }
    };

    initializeAuth();
  }, [navigate, setUser, setRole, setAuthenticated]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>Authenticating...</div>
    </div>
  );
}
