import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import useAuthStore from './hooks/useAuth';

// Pages
import RoleSelectionPage from './pages/RoleSelectionPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ChallengesPage from './pages/ChallengesPage';
import MissionPage from './pages/MissionPage';
import WorkspacePage from './pages/WorkspacePage';
import ResultsPage from './pages/ResultsPage';
import ProgressPage from './pages/ProgressPage';
import HistoryPage from './pages/HistoryPage';
import RecommendationsPage from './pages/RecommendationsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLearnersPage from './pages/AdminLearnersPage';
import AdminChallengesPage from './pages/AdminChallengesPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminLogsPage from './pages/AdminLogsPage';
import AdminSystemMonitorPage from './pages/AdminSystemMonitorPage';
import AdminAITracingPage from './pages/AdminAITracingPage';
import AdminIssuesPage from './pages/AdminIssuesPage';
import AdminGCPEnvironmentsPage from './pages/AdminGCPEnvironmentsPage';
import AdminLearnerInsightsPage from './pages/AdminLearnerInsightsPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, role } = useAuthStore();

  const ProtectedLayout = ({ children }) => (
    <div className="flex h-screen bg-cloud-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuToggle={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );

  // Role-based route protection
  const ProtectedRoute = ({ element, requiredRole }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (requiredRole && role !== requiredRole) {
      return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
    }
    return element;
  };

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        {!isAuthenticated ? (
          <>
            <Route path="/" element={<RoleSelectionPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            {/* User Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} requiredRole="user" />
              }
            />
            <Route
              path="/challenges"
              element={
                <ProtectedRoute element={<ProtectedLayout><ChallengesPage /></ProtectedLayout>} requiredRole="user" />
              }
            />
            <Route
              path="/mission/:id"
              element={
                <ProtectedRoute element={<ProtectedLayout><MissionPage /></ProtectedLayout>} requiredRole="user" />
              }
            />
            <Route
              path="/mission/new"
              element={
                <ProtectedRoute element={<ProtectedLayout><MissionPage /></ProtectedLayout>} requiredRole="user" />
              }
            />
            <Route
              path="/workspace/:id"
              element={
                <ProtectedRoute element={<ProtectedLayout><WorkspacePage /></ProtectedLayout>} requiredRole="user" />
              }
            />
            <Route
              path="/results/:id"
              element={
                <ProtectedRoute element={<ProtectedLayout><ResultsPage /></ProtectedLayout>} requiredRole="user" />
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute element={<ProtectedLayout><ProgressPage /></ProtectedLayout>} requiredRole="user" />
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute element={<ProtectedLayout><HistoryPage /></ProtectedLayout>} requiredRole="user" />
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute element={<ProtectedLayout><RecommendationsPage /></ProtectedLayout>} requiredRole="user" />
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute element={<ProtectedLayout><AdminDashboardPage /></ProtectedLayout>} requiredRole="admin" />
              }
            />
            <Route
              path="/admin/learners"
              element={
                <ProtectedRoute element={<ProtectedLayout><AdminLearnersPage /></ProtectedLayout>} requiredRole="admin" />
              }
            />
            <Route
              path="/admin/challenges"
              element={
                <ProtectedRoute element={<ProtectedLayout><AdminChallengesPage /></ProtectedLayout>} requiredRole="admin" />
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute element={<ProtectedLayout><AdminAnalyticsPage /></ProtectedLayout>} requiredRole="admin" />
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute element={<ProtectedLayout><AdminLogsPage /></ProtectedLayout>} requiredRole="admin" />
              }
            />
            <Route
              path="/admin/system"
              element={
                <ProtectedRoute element={<ProtectedLayout><AdminSystemMonitorPage /></ProtectedLayout>} requiredRole="admin" />
              }
            />
            <Route
              path="/admin/tracing"
              element={
                <ProtectedRoute element={<ProtectedLayout><AdminAITracingPage /></ProtectedLayout>} requiredRole="admin" />
              }
            />
            <Route
              path="/admin/issues"
              element={
                <ProtectedRoute element={<ProtectedLayout><AdminIssuesPage /></ProtectedLayout>} requiredRole="admin" />
              }
            />
            <Route
              path="/admin/gcp"
              element={
                <ProtectedRoute element={<ProtectedLayout><AdminGCPEnvironmentsPage /></ProtectedLayout>} requiredRole="admin" />
              }
            />
            <Route
              path="/admin/insights"
              element={
                <ProtectedRoute element={<ProtectedLayout><AdminLearnerInsightsPage /></ProtectedLayout>} requiredRole="admin" />
              }
            />

            {/* Default Routes */}
            <Route path="/" element={<Navigate to={role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />} />
            <Route path="*" element={<Navigate to={role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
