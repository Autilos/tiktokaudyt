import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PanelLayout } from './layouts/PanelLayout';
import { PlanView } from './pages/PlanView';
import { OverviewView } from './pages/OverviewView';
import { RunsView } from './pages/RunsView';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserAuditsView } from './pages/UserAuditsView';
import { UserVideoAuditsView } from './pages/UserVideoAuditsView';
import { AdminPanelView } from './pages/AdminPanelView';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-700 border-t-pink-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/panel"
            element={
              <ProtectedRoute>
                <PanelLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/panel/plan" replace />} />
            <Route path="plan" element={<PlanView />} />
            <Route path="overview" element={<OverviewView />} />
            <Route path="runs" element={<RunsView />} />
            <Route path="audyty" element={<UserAuditsView />} />
            <Route path="audyty-wideo" element={<UserVideoAuditsView />} />
          </Route>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute>
                <AdminPanelView />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
