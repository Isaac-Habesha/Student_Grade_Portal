/**
 * App — main router with role-based protected routes.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';

// Instructor Pages
import InstructorDashboard from './pages/instructor/Dashboard';
import CourseCreate from './pages/instructor/CourseCreate';
import CourseDetail from './pages/instructor/CourseDetail';
import ManageStudents from './pages/instructor/ManageStudents';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import CourseResult from './pages/student/CourseResult';

function RootRedirect() {
  const { isAuthenticated, isInstructor, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isInstructor
    ? <Navigate to="/instructor/dashboard" replace />
    : <Navigate to="/student/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Instructor Routes */}
          <Route
            element={
              <ProtectedRoute role="instructor">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
            <Route path="/instructor/courses/create" element={<CourseCreate />} />
            <Route path="/instructor/courses/:id" element={<CourseDetail />} />
            <Route path="/instructor/students" element={<ManageStudents />} />
          </Route>

          {/* Student Routes */}
          <Route
            element={
              <ProtectedRoute role="student">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/courses/:courseId/result" element={<CourseResult />} />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
