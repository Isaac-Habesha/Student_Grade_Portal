/**
 * CourseResult — student views their own published result.
 * Shows grade hero, rank, and per-component breakdown.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function CourseResult() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResult();
  }, [courseId]);

  const fetchResult = async () => {
    try {
      const res = await api.get(`/student/courses/${courseId}/result/`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load result.');
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
        <div className="loading-text">Loading result...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <button className="btn btn-secondary mb-4" onClick={() => navigate('/student/dashboard')}>
            ← Back to Courses
          </button>
        </div>
        <div className="empty-state glass-card-static">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">{error}</div>
          <div className="empty-state-text">
            Check back later. Your instructor will publish results when ready.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <button className="btn btn-secondary mb-6" onClick={() => navigate('/student/dashboard')}>
        ← Back to Courses
      </button>

      {/* Course Info */}
      <div className="page-header">
        <div className="course-code" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)' }}>
          {result.course_code}
        </div>
        <h1 className="page-title">{result.course_name}</h1>
        <p className="page-subtitle">
          Instructor: {result.instructor_name} · {result.credit_hours} credits
        </p>
      </div>

      {/* Result Hero */}
      <div className="result-hero slide-up">
        <div
          className="result-grade-large"
          style={{ color: getGradeColor(result.letter_grade) }}
        >
          {result.letter_grade}
        </div>
        <div className="result-score">
          {result.total_score}%
        </div>
        <div style={{ marginTop: 'var(--space-3)' }}>
          <span className={`badge ${result.passed ? 'badge-success' : 'badge-error'}`}
            style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--space-2) var(--space-5)' }}>
            {result.passed ? '✅ PASSED' : '❌ FAILED'}
          </span>
        </div>
        <div className="result-rank">
          🏆 Rank #{result.rank} in class
        </div>
      </div>

      {/* Grade Breakdown */}
      <h2 style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 700,
        marginBottom: 'var(--space-4)',
        color: 'var(--text-primary)',
      }}>
        Grade Breakdown
      </h2>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Your Score</th>
              <th>Max Score</th>
              <th>Weight</th>
              <th>Weighted Score</th>
            </tr>
          </thead>
          <tbody>
            {result.grade_breakdown?.map((item, idx) => (
              <tr key={idx}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {item.component}
                </td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.score}
                </td>
                <td>{item.max_score}</td>
                <td>
                  <span className="badge badge-info">{item.weight}%</span>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--accent-primary-hover)' }}>
                  {item.weighted_score}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border-medium)' }}>
              <td colSpan="4" style={{ fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                Total Weighted Score
              </td>
              <td style={{
                fontWeight: 800,
                fontSize: 'var(--font-size-lg)',
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {result.total_score}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Published timestamp */}
      {result.published_at && (
        <p style={{
          marginTop: 'var(--space-4)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          Published on {new Date(result.published_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
