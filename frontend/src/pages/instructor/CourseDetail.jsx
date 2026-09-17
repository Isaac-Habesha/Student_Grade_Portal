/**
 * CourseDetail — tabbed view for managing a course.
 * Tabs: Students, Components, Grades, Results
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/courses/${id}/`);
      setCourse(res.data);
    } catch {
      navigate('/instructor/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  if (loading || !course) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Loading course...</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header-actions">
        <div className="page-header">
          <div className="course-code" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)' }}>
            {course.code}
          </div>
          <h1 className="page-title">{course.name}</h1>
          <p className="page-subtitle">
            {course.credit_hours} credit hours · {course.enrolled_count || 0} students
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/instructor/dashboard')}
        >
          ← Back
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['students', 'components', 'grades', 'results'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'students' && '👥 '}
            {tab === 'components' && '📋 '}
            {tab === 'grades' && '✏️ '}
            {tab === 'results' && '📊 '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'students' && (
        <StudentsTab courseId={id} onMessage={showMessage} onRefresh={fetchCourse} />
      )}
      {activeTab === 'components' && (
        <ComponentsTab courseId={id} course={course} onMessage={showMessage} onRefresh={fetchCourse} />
      )}
      {activeTab === 'grades' && (
        <GradesTab courseId={id} onMessage={showMessage} />
      )}
      {activeTab === 'results' && (
        <ResultsTab courseId={id} onMessage={showMessage} />
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   Students Tab
   ═══════════════════════════════════════════════════════════ */

function StudentsTab({ courseId, onMessage, onRefresh }) {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, [courseId]);

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/students/`);
      setStudents(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEnrollModal = async () => {
    try {
      const res = await api.get('/auth/students/');
      setAllStudents(res.data.results || res.data);
      setSelectedStudents([]);
      setShowEnrollModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnroll = async () => {
    if (selectedStudents.length === 0) return;
    try {
      const res = await api.post(`/courses/${courseId}/enroll/`, {
        student_ids: selectedStudents,
      });
      onMessage(`Enrolled ${res.data.enrolled.length} student(s).`);
      setShowEnrollModal(false);
      fetchStudents();
      onRefresh();
    } catch (err) {
      onMessage(err.response?.data?.detail || 'Failed to enroll students.', 'error');
    }
  };

  const handleRemove = async (studentId) => {
    if (!confirm('Remove this student from the course?')) return;
    try {
      await api.delete(`/courses/${courseId}/students/${studentId}/`);
      onMessage('Student removed from course.');
      fetchStudents();
      onRefresh();
    } catch (err) {
      onMessage('Failed to remove student.', 'error');
    }
  };

  const enrolledIds = new Set(students.map(e => e.student_detail?.id || e.student));
  const availableStudents = allStudents.filter(s => !enrolledIds.has(s.id));
  const filteredAvailable = availableStudents.filter(s =>
    `${s.first_name} ${s.last_name} ${s.student_id} ${s.username}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          Enrolled Students ({students.length})
        </h3>
        <button className="btn btn-primary btn-sm" onClick={openEnrollModal}>
          ➕ Enroll Students
        </button>
      </div>

      {students.length === 0 ? (
        <div className="empty-state glass-card-static">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">No students enrolled</div>
          <div className="empty-state-text">
            Enroll students to start managing grades.
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((enrollment) => {
                const s = enrollment.student_detail;
                return (
                  <tr key={enrollment.id}>
                    <td><span className="badge badge-info">{s?.student_id}</span></td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {s?.first_name} {s?.last_name}
                    </td>
                    <td>{s?.username}</td>
                    <td>{s?.email}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemove(s?.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="modal-overlay" onClick={() => setShowEnrollModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Enroll Students</div>
              <button className="btn btn-ghost" onClick={() => setShowEnrollModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <input
                className="form-input mb-4"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {filteredAvailable.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
                  No available students found.
                </p>
              ) : (
                <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {filteredAvailable.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3"
                      style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        background: selectedStudents.includes(s.id) ? 'rgba(99,102,241,0.12)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, s.id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== s.id));
                          }
                        }}
                        style={{ accentColor: 'var(--accent-primary)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
                          {s.first_name} {s.last_name}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          {s.student_id} · {s.username}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEnrollModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEnroll}
                disabled={selectedStudents.length === 0}
              >
                Enroll ({selectedStudents.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   Components Tab
   ═══════════════════════════════════════════════════════════ */

function ComponentsTab({ courseId, course, onMessage, onRefresh }) {
  const [components, setComponents] = useState([]);
  const [form, setForm] = useState({ name: '', max_score: '100', weight_percent: '', display_order: 0 });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComponents();
  }, [courseId]);

  const fetchComponents = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/components/`);
      setComponents(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/components/${editing}/`, { ...form, course: courseId });
        onMessage('Component updated.');
      } else {
        await api.post(`/courses/${courseId}/components/`, { ...form, course: courseId });
        onMessage('Component added.');
      }
      setForm({ name: '', max_score: '100', weight_percent: '', display_order: 0 });
      setEditing(null);
      fetchComponents();
      onRefresh();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.non_field_errors?.[0]
        || data?.detail
        || Object.values(data || {}).flat().join(', ')
        || 'Failed to save component.';
      onMessage(msg, 'error');
    }
  };

  const handleEdit = (comp) => {
    setForm({
      name: comp.name,
      max_score: comp.max_score,
      weight_percent: comp.weight_percent,
      display_order: comp.display_order,
    });
    setEditing(comp.id);
  };

  const handleDelete = async (compId) => {
    if (!confirm('Delete this component?')) return;
    try {
      await api.delete(`/components/${compId}/`);
      onMessage('Component deleted.');
      fetchComponents();
      onRefresh();
    } catch (err) {
      onMessage('Failed to delete component.', 'error');
    }
  };

  const totalWeight = components.reduce((sum, c) => sum + parseFloat(c.weight_percent || 0), 0);

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          Grade Components
          <span style={{ fontWeight: 400, color: totalWeight === 100 ? 'var(--success)' : 'var(--warning)', marginLeft: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
            (Total: {totalWeight}% / 100%)
          </span>
        </h3>
      </div>

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="glass-card-static mb-6">
        <div style={{ marginBottom: 'var(--space-4)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
          {editing ? 'Edit Component' : 'Add Component'}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              className="form-input"
              placeholder="e.g., Midterm Exam"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max Score *</label>
            <input
              className="form-input"
              type="number"
              min="1"
              placeholder="100"
              value={form.max_score}
              onChange={(e) => setForm({ ...form, max_score: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Weight % *</label>
            <input
              className="form-input"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="25"
              value={form.weight_percent}
              onChange={(e) => setForm({ ...form, weight_percent: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Order</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button type="submit" className="btn btn-primary btn-sm">
            {editing ? 'Update' : 'Add Component'}
          </button>
          {editing && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEditing(null);
                setForm({ name: '', max_score: '100', weight_percent: '', display_order: 0 });
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Components Table */}
      {components.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Component</th>
                <th>Max Score</th>
                <th>Weight %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {components.map((comp) => (
                <tr key={comp.id}>
                  <td>{comp.display_order}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{comp.name}</td>
                  <td>{comp.max_score}</td>
                  <td>
                    <span className="badge badge-info">{comp.weight_percent}%</span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(comp)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(comp.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   Grades Tab (Spreadsheet-like grade entry)
   ═══════════════════════════════════════════════════════════ */

function GradesTab({ courseId, onMessage }) {
  const [gradesData, setGradesData] = useState(null);
  const [editedGrades, setEditedGrades] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, [courseId]);

  const fetchGrades = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/grades/`);
      setGradesData(res.data);
      // Initialize edited grades from existing data
      const initial = {};
      res.data.students.forEach((student) => {
        student.grades.forEach((grade) => {
          const key = `${student.enrollment_id}-${grade.component_id}`;
          initial[key] = grade.score || '';
        });
      });
      setEditedGrades(initial);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (enrollmentId, componentId, value) => {
    const key = `${enrollmentId}-${componentId}`;
    setEditedGrades({ ...editedGrades, [key]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    const grades = [];

    Object.entries(editedGrades).forEach(([key, score]) => {
      if (score === '' || score === null) return;
      const [enrollmentId, componentId] = key.split('-');
      grades.push({
        enrollment_id: parseInt(enrollmentId),
        component_id: parseInt(componentId),
        score: parseFloat(score),
      });
    });

    if (grades.length === 0) {
      onMessage('No grades to save.', 'warning');
      setSaving(false);
      return;
    }

    try {
      const res = await api.post(`/courses/${courseId}/grades/`, { grades });
      onMessage(`Saved ${res.data.saved} grade(s).`);
      if (res.data.errors?.length) {
        onMessage(`Some errors: ${res.data.errors.join('; ')}`, 'warning');
      }
      fetchGrades();
    } catch (err) {
      onMessage(err.response?.data?.detail || 'Failed to save grades.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  if (!gradesData || !gradesData.components?.length) {
    return (
      <div className="empty-state glass-card-static">
        <div className="empty-state-icon">📋</div>
        <div className="empty-state-title">No grade components defined</div>
        <div className="empty-state-text">
          Add grade components first before entering grades.
        </div>
      </div>
    );
  }

  if (!gradesData.students?.length) {
    return (
      <div className="empty-state glass-card-static">
        <div className="empty-state-icon">👥</div>
        <div className="empty-state-title">No students enrolled</div>
        <div className="empty-state-text">
          Enroll students first before entering grades.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          Grade Entry
        </h3>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : '💾 Save All Grades'}
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>ID</th>
              {gradesData.components.map((comp) => (
                <th key={comp.id} style={{ textAlign: 'center' }}>
                  {comp.name}
                  <div style={{ fontWeight: 400, fontSize: '0.65rem', opacity: 0.7 }}>
                    max: {comp.max_score} ({comp.weight_percent}%)
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gradesData.students.map((student) => (
              <tr key={student.enrollment_id}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {student.student_name}
                </td>
                <td>
                  <span className="badge badge-info">{student.student_id}</span>
                </td>
                {student.grades.map((grade) => {
                  const key = `${student.enrollment_id}-${grade.component_id}`;
                  const maxScore = parseFloat(grade.max_score);
                  const currentVal = editedGrades[key] || '';
                  const isInvalid = currentVal !== '' && parseFloat(currentVal) > maxScore;

                  return (
                    <td key={grade.component_id} style={{ textAlign: 'center' }}>
                      <input
                        className={`grade-input ${isInvalid ? 'invalid' : ''}`}
                        type="number"
                        min="0"
                        max={maxScore}
                        step="0.01"
                        placeholder="—"
                        value={currentVal}
                        onChange={(e) =>
                          handleGradeChange(
                            student.enrollment_id,
                            grade.component_id,
                            e.target.value
                          )
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   Results Tab
   ═══════════════════════════════════════════════════════════ */

function ResultsTab({ courseId, onMessage }) {
  const [results, setResults] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [courseId]);

  const fetchResults = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/results/`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await api.post(`/courses/${courseId}/calculate/`);
      onMessage(res.data.detail);
      fetchResults();
    } catch (err) {
      onMessage(err.response?.data?.detail || 'Failed to calculate results.', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Publish results? Students will be able to see their grades immediately.')) return;
    setPublishing(true);
    try {
      const res = await api.post(`/courses/${courseId}/publish/`);
      onMessage(res.data.detail);
      fetchResults();
    } catch (err) {
      onMessage(err.response?.data?.detail || 'Failed to publish results.', 'error');
    } finally {
      setPublishing(false);
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
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  const resultsList = results?.results || [];
  const hasUnpublished = resultsList.some(r => !r.is_published);
  const hasResults = resultsList.length > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          Results {hasResults && `(${resultsList.length} students)`}
        </h3>
        <div className="flex gap-3">
          <button
            className="btn btn-secondary"
            onClick={handleCalculate}
            disabled={calculating}
          >
            {calculating ? 'Calculating...' : '🔄 Calculate Results'}
          </button>
          {hasUnpublished && (
            <button
              className="btn btn-success"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : '📢 Publish Results'}
            </button>
          )}
        </div>
      </div>

      {!hasResults ? (
        <div className="empty-state glass-card-static">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No results calculated yet</div>
          <div className="empty-state-text">
            Enter all grades first, then click "Calculate Results" to compute final scores, letter grades, and rankings.
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Student ID</th>
                <th>Total Score</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Published</th>
              </tr>
            </thead>
            <tbody>
              {resultsList.map((result) => (
                <tr key={result.id}>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: result.rank <= 3 ? 'var(--accent-primary-hover)' : 'var(--text-secondary)',
                      fontSize: result.rank <= 3 ? 'var(--font-size-base)' : 'var(--font-size-sm)',
                    }}>
                      #{result.rank}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {result.student_name}
                  </td>
                  <td>
                    <span className="badge badge-info">{result.student_id}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {result.total_score}%
                  </td>
                  <td>
                    <span
                      className="badge badge-grade"
                      style={{ color: getGradeColor(result.letter_grade), background: `${getGradeColor(result.letter_grade)}20` }}
                    >
                      {result.letter_grade}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${result.passed ? 'badge-success' : 'badge-error'}`}>
                      {result.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${result.is_published ? 'badge-success' : 'badge-warning'}`}>
                      {result.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
