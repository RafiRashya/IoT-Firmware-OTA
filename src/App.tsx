import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import FirmwareUpload from './components/FirmwareUpload';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ResetPassword from './components/ResetPassword';
import History from './components/History';

function App() {
  useEffect(() => {
    // Handle email confirmation redirect
    const handleEmailConfirmation = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=signup')) {
        try {
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
          
          // Redirect ke login dengan pesan sukses
          window.location.href = '/login?confirmed=true';
        } catch (err) {
          console.error('Email confirmation error:', err);
          window.location.href = '/login?error=confirmation-failed';
        }
      }
    };

    handleEmailConfirmation();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<ProtectedRoute><Layout><Outlet /></Layout></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/firmware" element={<FirmwareUpload />} />
            <Route path="/history" element={<History />} />
            <Route index element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;