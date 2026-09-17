/**
 * Instructor Dashboard — shows courses with stats.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses/');
      setCourses(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header-actions">
        <div className="page-header">
          <h1 className="page-title">Instructor Dashboard</h1>
          <p className="page-subtitle">Manage your courses, grades, and results</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/instructor/courses/create')}
        >
          ➕ New Course
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Courses</div>
          <div className="stat-value">{courses.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Students</div>
          <div className="stat-value">
            {courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0)}
          </div>
          <div className="stat-meta">Across all courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ready to Grade</div>
          <div className="stat-value">
            {courses.filter(c => c.components_weight_total === '100.00' || c.components_weight_total == 100).length}
          </div>
          <div className="stat-meta">Components = 100%</div>
        </div>
      </div>

      {/* Course Grid */}
      {courses.length === 0 ? (
        <div className="empty-state glass-card-static">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">No courses yet</div>
          <div className="empty-state-text">
            Create your first course to start managing grades.
          </div>
          <button
            className="btn btn-primary mt-6"
            onClick={() => navigate('/instructor/courses/create')}
          >
            Create Course
          </button>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div
              key={course.id}
              className="course-card"
              onClick={() => navigate(`/instructor/courses/${course.id}`)}
            >
              <div className="course-code">{course.code}</div>
              <div className="course-name">{course.name}</div>
              <div className="course-meta">
                <div className="course-meta-item">
                  👥 {course.enrolled_count || 0} students
                </div>
                <div className="course-meta-item">
                  📝 {course.credit_hours} credits
                </div>
                <div className="course-meta-item">
                  {parseFloat(course.components_weight_total) === 100
                    ? <span className="badge badge-success">Ready</span>
                    : <span className="badge badge-warning">{course.components_weight_total}%</span>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
