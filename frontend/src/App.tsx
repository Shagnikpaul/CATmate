import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CabHeader } from './components/layout/CabHeader';
import { DevToolsBar } from './components/layout/DevToolsBar';
import { VoiceBar } from './components/layout/VoiceBar';
import { Login } from './pages/Login';
import { OperatorHome } from './pages/operator/OperatorHome';
import { TaskDetail } from './pages/operator/TaskDetail';
import { IncidentLog } from './pages/operator/IncidentLog';
import { TrainingHub } from './pages/operator/TrainingHub';
import { ManagerOverview } from './pages/manager/ManagerOverview';
import { ManagerTaskAllocation } from './pages/manager/ManagerTaskAllocation';
import { ManagerIncidentLog } from './pages/manager/ManagerIncidentLog';

// Route protector ensuring active shift session
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center font-industrial text-xl uppercase tracking-wider text-text-secondary">
        Initializing In-Cab Terminal...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col antialiased selection:bg-[#FFC300] selection:text-[#211E1C]">
      <DevToolsBar />
      <CabHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {children}
      </main>
      <VoiceBar />
    </div>
  );
};

export function App() {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={role === 'manager' ? '/manager' : '/operator'} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Operator In-Cab Routes */}
      <Route
        path="/operator"
        element={
          <ProtectedLayout>
            <OperatorHome />
          </ProtectedLayout>
        }
      />
      <Route
        path="/operator/task/:id"
        element={
          <ProtectedLayout>
            <TaskDetail />
          </ProtectedLayout>
        }
      />
      <Route
        path="/operator/incident"
        element={
          <ProtectedLayout>
            <IncidentLog />
          </ProtectedLayout>
        }
      />
      <Route
        path="/operator/training"
        element={
          <ProtectedLayout>
            <TrainingHub />
          </ProtectedLayout>
        }
      />

      {/* Site Manager Operations Routes */}
      <Route
        path="/manager"
        element={
          <ProtectedLayout>
            <ManagerOverview />
          </ProtectedLayout>
        }
      />
      <Route
        path="/manager/allocate"
        element={
          <ProtectedLayout>
            <ManagerTaskAllocation />
          </ProtectedLayout>
        }
      />
      <Route
        path="/manager/incidents"
        element={
          <ProtectedLayout>
            <ManagerIncidentLog />
          </ProtectedLayout>
        }
      />

      {/* Default index redirection based on user role */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={role === 'manager' ? '/manager' : '/operator'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
