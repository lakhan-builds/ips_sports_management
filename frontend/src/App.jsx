import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Users from './pages/Users/Users';
import Sports from './pages/Sports/Sports';
import Branches from './pages/Branches/Branches';
import Trials from './pages/Trials/Trials';
import Forms from './pages/Forms/Forms';
import Submissions from './pages/Submissions/Submissions';
import Selections from './pages/Selections/Selections';
import Reports from './pages/Reports/Reports';
import AuditLogs from './pages/AuditLogs/AuditLogs';
import PublicTrials from './pages/PublicPortal/PublicTrials';

function RootRedirect() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/public-trials" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/public-trials" element={<PublicTrials />} />

          {/* Protected Institutional routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SPORTS_COORDINATOR']}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-coordinators"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_COORDINATOR']}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'STUDENT_COORDINATOR']}>
                  <Sports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branches"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SPORTS_COORDINATOR']}>
                  <Branches />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trials"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SPORTS_COORDINATOR', 'BRANCH_COORDINATOR']}>
                  <Trials />
                </ProtectedRoute>
              }
            />
            <Route path="/forms" element={<Forms />} />
            <Route path="/submissions" element={<Submissions />} />
            <Route path="/selections" element={<Selections />} />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SPORTS_COORDINATOR', 'BRANCH_COORDINATOR']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SPORTS_COORDINATOR']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
