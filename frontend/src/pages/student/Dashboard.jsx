/**
 * Student Dashboard — shows enrolled courses with rank standing and verified profile photo.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/student/courses/');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: '🥇', label: '1st Place', color: '#fbbf24' };
    if (rank === 2) return { icon: '🥈', label: '2nd Place', color: '#94a3b8' };
    if (rank === 3) return { icon: '🥉', label: '3rd Place', color: '#d97706' };
    return { icon: '🏆', label: `Rank #${rank}`, color: '#38bdf8' };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Loading your courses...</div>
      </div>
    );
  }

  const studentPhoto = user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.first_name || 'student'}`;

  return (
    <div className="fade-in">
      {/* Welcome Banner with Student Photo */}
      <div className="student-welcome-banner slide-up">
        <div className="student-welcome-left">
          <div className="student-avatar-lg-wrapper">
            <img
              src={studentPhoto}
              alt={user?.first_name || 'Student'}
              className="student-avatar-lg"
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.first_name || 'student'}`;
              }}
            />
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 'var(--space-1)' }}>
              Welcome, {user?.first_name}!
            </h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Student ID: <span className="badge badge-info" style={{ fontWeight: 600 }}>{user?.student_id}</span> · Select a course to view official rankings
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Enrolled Courses</div>
          <div className="stat-value">{courses.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rankings Published</div>
          <div className="stat-value">{courses.filter(c => c.has_result).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Passed</div>
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text' }}>
            {courses.filter(c => c.passed === true).length}
          </div>
        </div>
      </div>

      {/* Course Cards */}
      {courses.length === 0 ? (
        <div className="empty-state glass-card-static">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">No courses yet</div>
          <div className="empty-state-text">
            You haven't been enrolled in any courses yet. Your instructor will enroll you.
          </div>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => {
            const rankBadge = course.has_result ? getRankBadge(course.rank) : null;
            return (
              <div
                key={course.course_id}
                className="course-card"
                onClick={() => course.has_result && navigate(`/student/courses/${course.course_id}/result`)}
                style={{ cursor: course.has_result ? 'pointer' : 'default' }}
              >
                <div className="flex justify-between items-center">
                  <div className="course-code">{course.course_code}</div>
                  {course.has_result ? (
                    <span
                      className="badge"
                      style={{
                        color: rankBadge.color,
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: `1px solid ${rankBadge.color}40`,
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 700,
                        padding: 'var(--space-1) var(--space-3)',
                      }}
                    >
                      {rankBadge.icon} Rank #{course.rank}
                    </span>
                  ) : (
                    <span className="badge badge-warning">Grading in Progress</span>
                  )}
                </div>

                <div className="course-name">{course.course_name}</div>

                <div className="course-meta">
                  <div className="course-meta-item">
                    📝 {course.credit_hours} credits
                  </div>
                  <div className="course-meta-item">
                    👤 {course.instructor_name}
                  </div>
                  {course.has_result && (
                    <div className="course-meta-item">
                      {course.passed ? (
                        <span className="badge badge-success">PASSED</span>
                      ) : (
                        <span className="badge badge-error">FAILED</span>
                      )}
                    </div>
                  )}
                </div>

                {course.has_result && (
                  <div style={{
                    marginTop: 'var(--space-3)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span>View Rank Breakdown →</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Score: {course.total_score}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
