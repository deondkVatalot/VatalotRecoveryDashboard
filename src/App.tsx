import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataVerification from './pages/DataVerification';
import DataManagement from './pages/DataManagement';
import DataHistory from './pages/DataHistory';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/verify" element={<DataVerification />} />
          <Route path="/data" element={<DataManagement />} />
          <Route path="/history" element={<DataHistory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;