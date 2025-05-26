import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import FirmwareUpload from './components/FirmwareUpload';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ResetPassword from './components/ResetPassword';
import History from './components/History';

function App() {
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
