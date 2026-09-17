/**
 * LoginPage — Dual portal login for Students (ID + Nickname) and Instructors (Username/Email + Password).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [mode, setMode] = useState('student'); // 'student' | 'instructor'
  
  // Student form state
  const [studentId, setStudentId] = useState('');
  const [nickname, setNickname] = useState('');

  // Instructor form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginStudent, loginInstructor } = useAuth();
  const navigate = useNavigate();

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError('');
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginStudent(studentId, nickname);
      navigate('/student/dashboard');
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.detail
        || err.response?.data?.student_id?.[0]
        || err.response?.data?.nickname?.[0]
        || 'Invalid Student ID or Nickname.';
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
      const user = await loginInstructor(username, password);
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

  const fillStudentDemo = (id, nick) => {
    setStudentId(id);
    setNickname(nick);
    setError('');
  };

  const fillInstructorDemo = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card slide-up">
        <div className="login-header">
          <div className="login-logo">GradePortal</div>
          <div className="login-tagline">Academic Grade Management Portal</div>
        </div>

        {/* Tab switch */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${mode === 'student' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('student')}
          >
            🎓 Student Access
          </button>
          <button
            type="button"
            className={`login-tab-btn ${mode === 'instructor' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('instructor')}
          >
            👨‍🏫 Instructor / Admin
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {mode === 'student' ? (
          /* Student Login Form */
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
              <label className="form-label" htmlFor="nickname">Special Nickname</label>
              <input
                id="nickname"
                className="form-input"
                type="text"
                placeholder="e.g. Ace"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                Assigned by your instructor (no password needed)
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Access My Grades & Dashboard →'}
            </button>

            {/* Quick Demo Fill for Students */}
            <div className="login-demo-box">
              <div className="login-demo-title">Quick Demo Logins (Click to autofill)</div>
              <div className="login-demo-chips">
                <button
                  type="button"
                  className="login-demo-chip"
                  onClick={() => fillStudentDemo('STU-260001', 'Ace')}
                >
                  Alice (STU-260001 / Ace)
                </button>
                <button
                  type="button"
                  className="login-demo-chip"
                  onClick={() => fillStudentDemo('STU-260002', 'Bobby')}
                >
                  Bob (STU-260002 / Bobby)
                </button>
                <button
                  type="button"
                  className="login-demo-chip"
                  onClick={() => fillStudentDemo('STU-260003', 'Chuck')}
                >
                  Charlie (STU-260003 / Chuck)
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Instructor Login Form */
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

            {/* Quick Demo Fill for Instructors */}
            <div className="login-demo-box">
              <div className="login-demo-title">Instructor Demo Accounts</div>
              <div className="login-demo-chips">
                <button
                  type="button"
                  className="login-demo-chip"
                  onClick={() => fillInstructorDemo('dr.smith', 'instructor123')}
                >
                  Dr. Smith (dr.smith)
                </button>
                <button
                  type="button"
                  className="login-demo-chip"
                  onClick={() => fillInstructorDemo('admin', 'admin123')}
                >
                  Admin (admin)
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
