import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import Trading from './pages/Trading';
import Bots from './pages/Bots';
import Funding from './pages/Funding';
import Referrals from './pages/Referrals';
import Profile from './pages/Profile';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/markets" element={<PrivateRoute><Layout><Markets /></Layout></PrivateRoute>} />
      <Route path="/trading" element={<PrivateRoute><Layout><Trading /></Layout></PrivateRoute>} />
      <Route path="/bots" element={<PrivateRoute><Layout><Bots /></Layout></PrivateRoute>} />
      <Route path="/funding" element={<PrivateRoute><Layout><Funding /></Layout></PrivateRoute>} />
      <Route path="/referrals" element={<PrivateRoute><Layout><Referrals /></Layout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
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
