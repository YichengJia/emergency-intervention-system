import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import PrivacyPolicy from './components/Auth/PrivacyPolicy';
import PatientDashboard from './components/Dashboard/PatientDashboard';
import DoctorDashboard from './components/Dashboard/DoctorDashboard';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user } = useAuth();
  return (
    <Router>
      <MainLayout>
        <Routes>
          {/* Default route: redirect based on user role */}
          <Route
            path="/"
            element={
              user ? (
                user.role === 'doctor' ? (
                  <Navigate to="/dashboard/doctor" />
                ) : (
                  <Navigate to="/dashboard/patient" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route
            path="/dashboard/patient"
            element={
              <ProtectedRoute roles={[ 'patient' ]}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/doctor"
            element={
              <ProtectedRoute roles={[ 'doctor' ]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;