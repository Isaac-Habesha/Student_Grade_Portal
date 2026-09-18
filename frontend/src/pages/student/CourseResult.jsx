/**
 * CourseResult — Student views their verified result with profile image and class rank.
 * Strictly labels performance by Class Rank without letter grades per school grading policy.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function CourseResult() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: '🥇', label: '1st Place (Top Rank)', color: '#fbbf24' };
    if (rank === 2) return { icon: '🥈', label: '2nd Place', color: '#94a3b8' };
    if (rank === 3) return { icon: '🥉', label: '3rd Place', color: '#d97706' };
    return { icon: '🏆', label: `Rank #${rank}`, color: '#38bdf8' };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Loading verified result...</div>
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
            Check back later. Your instructor will publish results when grading is finalized.
          </div>
        </div>
      </div>
    );
  }

  const rankInfo = getRankBadge(result.rank);
  const studentPhoto = result.student_photo_url || user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.student_name || user?.first_name || 'student'}`;

  return (
    <div className="fade-in">
      <button className="btn btn-secondary mb-6" onClick={() => navigate('/student/dashboard')}>
        ← Back to Courses
      </button>

      {/* Student Profile & Credential Card */}
      <div className="student-profile-header slide-up">
        <div className="student-profile-avatar-wrapper">
          <img
            src={studentPhoto}
            alt={result.student_name || 'Student Photo'}
            className="student-profile-avatar"
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.student_name || 'student'}`;
            }}
          />
          <div className="student-verified-badge" title="Verified Student Profile">✓</div>
        </div>

        <div className="student-profile-details">
          <div className="student-id-tag">Student ID: {result.student_id || user?.student_id}</div>
          <h2 className="student-name-heading">{result.student_name || `${user?.first_name} ${user?.last_name}`}</h2>
          <div className="student-meta-row">
            <span>📚 <strong>Course:</strong> {result.course_code} — {result.course_name}</span>
            <span>👨‍🏫 <strong>Instructor:</strong> {result.instructor_name}</span>
            <span>⏱️ <strong>Credits:</strong> {result.credit_hours}</span>
          </div>
        </div>
      </div>

      {/* Result Hero — Purely Rank-Based Labeling */}
      <div className="result-hero slide-up" style={{ marginTop: 'var(--space-6)' }}>
        <div className="result-rank-icon">{rankInfo.icon}</div>
        
        <div className="result-rank-title" style={{ color: rankInfo.color }}>
          RANK #{result.rank}
        </div>

        <div className="result-rank-subtitle">
          {result.total_enrolled ? `Ranked #${result.rank} out of ${result.total_enrolled} students` : rankInfo.label}
        </div>

        <div className="result-score-container">
          <div className="result-score-val">
            Overall Score: <strong>{result.total_score}%</strong>
          </div>
          <span
            className={`badge ${result.passed ? 'badge-success' : 'badge-error'}`}
            style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--space-2) var(--space-5)' }}
          >
            {result.passed ? '✅ PASSED' : '❌ FAILED'}
          </span>
        </div>
      </div>

      {/* Grade Breakdown */}
      <h2 style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 700,
        marginTop: 'var(--space-8)',
        marginBottom: 'var(--space-4)',
        color: 'var(--text-primary)',
      }}>
        Component Performance Breakdown
      </h2>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Evaluation Component</th>
              <th>Score Obtained</th>
              <th>Maximum Score</th>
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
                Total Weighted Aggregate
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
          marginTop: 'var(--space-6)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          Official Result Published on {new Date(result.published_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
