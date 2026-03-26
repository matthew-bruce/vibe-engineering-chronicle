import { useState, useEffect } from 'react';
import { fmtDate, today } from '../constants.js';
import {
  getProjectMilestones,
  addProjectMilestone,
  updateProjectMilestone,
  softDeleteProjectMilestone,
} from '../../lib/db.js';

const MILESTONE_TYPES = [
  'kickoff', 'poc', 'prototype', 'release', 'milestone', 'review', 'other',
];

const blankMilestone = () => ({
  date: today(),
  type: 'milestone',
  title: '',
  description: '',
});

export default function ProjectMilestones({ projectId }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(blankMilestone);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getProjectMilestones(projectId)
      .then(data => setMilestones(data))
      .catch(err => console.error('[Chronicle] getProjectMilestones failed:', err))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleAdd = async () => {
    if (!addForm.title.trim()) return;
    setSaving(true);
    try {
      const saved = await addProjectMilestone(projectId, {
        ...addForm,
        order: milestones.length,
      });
      setMilestones(p => [...p, saved].sort((a, b) => a.date.localeCompare(b.date)));
      setAddForm(blankMilestone);
      setShowAdd(false);
    } catch (err) {
      console.error('[Chronicle] addProjectMilestone failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m) => {
    setEditForm({ date: m.date, type: m.type || 'milestone', title: m.title, description: m.description || '' });
    setEditId(m.id);
    setConfirmDel(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) return;
    setSaving(true);
    try {
      await updateProjectMilestone(editId, editForm);
      setMilestones(p =>
        p.map(m => m.id === editId ? { ...m, ...editForm } : m)
          .sort((a, b) => a.date.localeCompare(b.date))
      );
      setEditId(null);
    } catch (err) {
      console.error('[Chronicle] updateProjectMilestone failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await softDeleteProjectMilestone(id);
      setMilestones(p => p.filter(m => m.id !== id));
      setConfirmDel(null);
    } catch (err) {
      console.error('[Chronicle] softDeleteProjectMilestone failed:', err);
    }
  };

  return (
    <div className="proj-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="proj-section-label">Milestones</div>
        <button className="btn btn-ghost btn-sm" onClick={() => { setShowAdd(s => !s); setEditId(null); }}>
          {showAdd ? '✕ Cancel' : '+ Add Milestone'}
        </button>
      </div>

      {showAdd && (
        <div className="milestone-form">
          <div className="milestone-form-grid">
            <div>
              <div className="form-label">Date</div>
              <input className="form-input" type="date" value={addForm.date} onChange={e => setAddForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <div className="form-label">Type</div>
              <select className="form-select" value={addForm.type} onChange={e => setAddForm(p => ({ ...p, type: e.target.value }))}>
                {MILESTONE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <div className="form-label">Title *</div>
              <input className="form-input" placeholder="e.g. MVP shipped to first users" value={addForm.title} onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <div className="form-label">Description</div>
              <textarea className="form-textarea" placeholder="What happened? What was significant?" value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving…' : 'Add Milestone'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--ff-mono)' }}>Loading…</div>
      ) : milestones.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>No milestones yet.</div>
      ) : (
        <div className="milestone-timeline">
          {milestones.map((m, i) => (
            <div key={m.id} className="milestone-item">
              <div className="milestone-date-col">{fmtDate(m.date)}</div>
              <div className="milestone-connector">
                <div className="milestone-dot" />
                {i < milestones.length - 1 && <div className="milestone-line" />}
              </div>
              <div className="milestone-content">
                {editId === m.id ? (
                  <>
                    <div className="milestone-form-grid" style={{ marginBottom: 8 }}>
                      <div>
                        <div className="form-label">Date</div>
                        <input className="form-input" type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} />
                      </div>
                      <div>
                        <div className="form-label">Type</div>
                        <select className="form-select" value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}>
                          {MILESTONE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                        </select>
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <div className="form-label">Title</div>
                        <input className="form-input" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <div className="form-label">Description</div>
                        <textarea className="form-textarea" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-actions" style={{ marginTop: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={saving}>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {m.type && <span className="milestone-type-badge">{m.type}</span>}
                      <span className="milestone-title">{m.title}</span>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                        {confirmDel === m.id ? (
                          <>
                            <button className="btn btn-ghost btn-sm" style={{ color: '#E86161', fontSize: 11 }} onClick={() => handleDelete(m.id)}>Delete?</button>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setConfirmDel(null)}>✕</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => startEdit(m)}>✎</button>
                            <button className="btn btn-ghost btn-sm btn-icon" title="Delete" onClick={() => setConfirmDel(m.id)}>🗑</button>
                          </>
                        )}
                      </div>
                    </div>
                    {m.description && <div className="milestone-description">{m.description}</div>}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
