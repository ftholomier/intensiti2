import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Screens from './pages/Screens';
import MediaLibrary from './pages/MediaLibrary';
import Playlists from './pages/Playlists';
import PlaylistEditor from './pages/PlaylistEditor';
import SettingsPage from './pages/Settings';
import TickerPage from './pages/TickerPage';
import Display from './pages/Display';
import './App.css';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <Routes>
      {/* Public display route */}
      <Route path="/display/:code" element={<Display />} />

      {/* Auth */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/clients" element={
        <ProtectedRoute allowedRoles={['super_admin']}>
          <Clients />
        </ProtectedRoute>
      } />
      <Route path="/screens" element={
        <ProtectedRoute allowedRoles={['client']}>
          <Screens />
        </ProtectedRoute>
      } />
      <Route path="/media" element={
        <ProtectedRoute allowedRoles={['client']}>
          <MediaLibrary />
        </ProtectedRoute>
      } />
      <Route path="/playlists" element={
        <ProtectedRoute allowedRoles={['client']}>
          <Playlists />
        </ProtectedRoute>
      } />
      <Route path="/playlists/:id" element={
        <ProtectedRoute allowedRoles={['client']}>
          <PlaylistEditor />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['client']}>
          <SettingsPage />
        </ProtectedRoute>
      } />
      <Route path="/ticker" element={
        <ProtectedRoute allowedRoles={['client']}>
          <TickerPage />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
