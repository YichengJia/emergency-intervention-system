import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Component to protect routes requiring authentication and specific roles.
 * If user is not authenticated, they will be redirected to the login page.
 * If roles are specified, the user must have one of those roles to access
 * the child component; otherwise they are redirected to the default route.
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();
  if (loading) {
    return null;
  }
  if (!user) {
    return <Navigate to="/login" />;
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    // redirect to home if not authorised
    return <Navigate to="/" />;
  }
  return children;
}