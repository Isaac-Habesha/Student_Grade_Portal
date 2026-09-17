/**
 * ProtectedRoute — guards routes based on authentication and role.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    // Redirect to appropriate dashboard
    const redirect = user?.role === 'instructor'
      ? '/instructor/dashboard'
      : '/student/dashboard';
    return <Navigate to={redirect} replace />;
  }

  return children;
}
