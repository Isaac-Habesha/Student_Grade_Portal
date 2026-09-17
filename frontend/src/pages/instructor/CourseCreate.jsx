/**
 * CourseCreate — form for creating a new course.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function CourseCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    credit_hours: 3,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/courses/', form);
      navigate(`/instructor/courses/${res.data.id}`);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.entries(data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        setError(messages);
      } else {
        setError('Failed to create course.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Create New Course</h1>
        <p className="page-subtitle">Set up a new course for your students</p>
      </div>

      <div className="glass-card-static" style={{ maxWidth: 600 }}>
        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{error}</pre>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="code">Course Code *</label>
              <input
                id="code"
                name="code"
                className="form-input"
                placeholder="e.g., CS101"
                value={form.code}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="credit_hours">Credit Hours *</label>
              <input
                id="credit_hours"
                name="credit_hours"
                type="number"
                className="form-input"
                min="1"
                max="12"
                value={form.credit_hours}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">Course Name *</label>
            <input
              id="name"
              name="name"
              className="form-input"
              placeholder="e.g., Introduction to Computer Science"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              placeholder="Course description (optional)"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Course'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/instructor/dashboard')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
