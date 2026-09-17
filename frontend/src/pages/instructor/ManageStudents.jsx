/**
 * ManageStudents — for instructors to view students and create new passwordless student accounts.
 */

import { useState } from 'react';
import api from '../../api/client';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    nickname: '',
    username: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetched, setFetched] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/students/');
      setStudents(res.data.results || res.data);
      setFetched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!fetched) fetchStudents();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAutoSuggestNickname = () => {
    if (form.first_name) {
      setForm((prev) => ({
        ...prev,
        nickname: prev.first_name.trim(),
      }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/auth/students/', form);
      setSuccess(`Student created successfully! Student ID: ${res.data.student_id} | Nickname: "${res.data.nickname}". No password required!`);
      setForm({ first_name: '', last_name: '', nickname: '', username: '', email: '' });
      fetchStudents();
      setTimeout(() => setShowCreateModal(false), 3000);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.entries(data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        setError(messages);
      } else {
        setError('Failed to create student.');
      }
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header-actions">
        <div className="page-header">
          <h1 className="page-title">Manage Students</h1>
          <p className="page-subtitle">Register and view all students (passwordless access with ID + Nickname)</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setError(''); setSuccess(''); setShowCreateModal(true); }}>
          ➕ Register New Student
        </button>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : students.length === 0 ? (
        <div className="empty-state glass-card-static">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">No students yet</div>
          <div className="empty-state-text">Register students to assign courses and enter grades.</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Full Name</th>
                <th>Access Nickname</th>
                <th>Username</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td><span className="badge badge-info">{s.student_id}</span></td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {s.first_name} {s.last_name}
                  </td>
                  <td>
                    <span className="badge badge-success" style={{ fontWeight: 600, letterSpacing: '0.02em' }}>
                      🔑 {s.nickname || '—'}
                    </span>
                  </td>
                  <td>{s.username}</td>
                  <td>{s.email || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register Student Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Register New Student</div>
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  💡 <strong>Passwordless Flow:</strong> Students will log in using their auto-generated <strong>Student ID</strong> and this <strong>Special Nickname</strong>.
                </div>

                {error && <div className="alert alert-error"><pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{error}</pre></div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      className="form-input"
                      name="first_name"
                      placeholder="e.g. Maya"
                      value={form.first_name}
                      onChange={handleChange}
                      onBlur={handleAutoSuggestNickname}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input
                      className="form-input"
                      name="last_name"
                      placeholder="e.g. Lin"
                      value={form.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Special Nickname * (Student's login key)</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <input
                      className="form-input"
                      name="nickname"
                      placeholder="e.g. Maya or Star"
                      value={form.nickname}
                      onChange={handleChange}
                      required
                    />
                    {form.first_name && !form.nickname && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ whiteSpace: 'nowrap', fontSize: 'var(--font-size-xs)' }}
                        onClick={() => setForm((p) => ({ ...p, nickname: p.first_name }))}
                      >
                        Use First Name
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Username (Optional — auto-generated if left blank)</label>
                  <input
                    className="form-input"
                    name="username"
                    placeholder="e.g. maya.lin"
                    value={form.username}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    className="form-input"
                    type="email"
                    name="email"
                    placeholder="student@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Register Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
