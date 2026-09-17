/**
 * Student Dashboard — shows enrolled courses with result status.
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

  const getGradeColor = (grade) => {
    if (grade === 'A') return 'var(--grade-a)';
    if (grade?.startsWith('B')) return 'var(--grade-b)';
    if (grade?.startsWith('C')) return 'var(--grade-c)';
    if (grade === 'D') return 'var(--grade-d)';
    return 'var(--grade-f)';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Loading your courses...</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.first_name}!</h1>
        <p className="page-subtitle">
          Student ID: {user?.student_id} · Select a course to view your results
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Enrolled Courses</div>
          <div className="stat-value">{courses.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Results Available</div>
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
          {courses.map((course) => (
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
                    className="badge badge-grade"
                    style={{
                      color: getGradeColor(course.letter_grade),
                      background: `${getGradeColor(course.letter_grade)}20`,
                      fontSize: 'var(--font-size-lg)',
                      padding: 'var(--space-1) var(--space-4)',
                    }}
                  >
                    {course.letter_grade}
                  </span>
                ) : (
                  <span className="badge badge-warning">Pending</span>
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
                      <span className="badge badge-success">PASS</span>
                    ) : (
                      <span className="badge badge-error">FAIL</span>
                    )}
                  </div>
                )}
              </div>

              {course.has_result && (
                <div style={{
                  marginTop: 'var(--space-3)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--accent-primary)',
                  fontWeight: 500,
                }}>
                  Click to view detailed result →
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
