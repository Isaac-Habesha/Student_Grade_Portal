/**
 * LoginPage — Dedicated login portals for Students (ID + First Name) and Instructors (Username/Email + Password).
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ mode: initialMode = 'student' }) {
  const isInstructorMode = initialMode === 'instructor';

  // Student form state
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');

  // Instructor form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginStudent, loginInstructor } = useAuth();
  const navigate = useNavigate();

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginStudent(studentId.trim(), firstName.trim());
      navigate('/student/dashboard');
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.detail
        || err.response?.data?.student_id?.[0]
        || err.response?.data?.first_name?.[0]
        || 'Invalid Student ID or First Name.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInstructorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginInstructor(username.trim(), password);
      navigate('/instructor/dashboard');
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.detail
        || err.response?.data?.username?.[0]
        || err.response?.data?.password?.[0]
        || 'Invalid instructor credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card slide-up">
        <div className="login-header">
          <div className="login-logo">GradePortal</div>
          <div className="login-tagline">
            {isInstructorMode ? '👨‍🏫 Instructor & Administrator Portal' : '🎓 Student Access Portal'}
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)', marginBottom: 0 }}>
            {isInstructorMode
              ? 'Authorized faculty and administrative sign-in'
              : 'Passwordless grade lookup with Student ID & First Name'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {!isInstructorMode ? (
          /* Student Login Form — Strictly for Students (ID + First Name) */
          <form className="login-form" onSubmit={handleStudentSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="studentId">Student ID</label>
              <input
                id="studentId"
                className="form-input"
                type="text"
                placeholder="e.g. STU-260001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                className="form-input"
                type="text"
                placeholder="e.g. Alice"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                Enter your registered first name (no password required)
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? 'Verifying Student Account...' : 'Access My Results & Rankings →'}
            </button>

            {/* Link to Instructor Portal */}
            <div style={{ textAlign: 'center', marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', fontSize: 'var(--font-size-xs)' }}>
              Are you an instructor or admin?{' '}
              <Link to="/instructor/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                Faculty Sign In →
              </Link>
            </div>
          </form>
        ) : (
          /* Instructor Login Form — Strictly for Instructors */
          <form className="login-form" onSubmit={handleInstructorSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username or Email</label>
              <input
                id="username"
                className="form-input"
                type="text"
                placeholder="dr.smith or instructor@gradeportal.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In as Instructor →'}
            </button>

            {/* Link to Student Portal */}
            <div style={{ textAlign: 'center', marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', fontSize: 'var(--font-size-xs)' }}>
              Are you a student?{' '}
              <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                Student Access Portal →
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
