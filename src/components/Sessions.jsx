import { useState } from 'react';
import { PROJECTS, minsToHours, durToMins, uid, fmtDate, today } from '../constants.js';

export default function Sessions({ sessions, onAdd, onUpdate, onDelete, onAddTl }) {
  const blankForm = { project: PROJECTS[0], date: today(), durD: '', durH: '', durM: '', notes: '', addToTl: false };
  const [form, setForm] = useState(blankForm);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const ef = (k, v) => setEditForm(p => ({ ...p, [k]: v }));
  const [confirmDel, setConfirmDel] = useState(null);

  const startEdit = s => {
    const total = Number(s.durationMins) || 0;
    const d = Math.floor(total / 1440);
    const rem = total % 1440;
    const h = Math.floor(rem / 60);
    const m = rem % 60;
    setEditForm({ project: s.project, date: s.date, durD: d || '', durH: h || '', durM: m || '', notes: s.notes || '' });
    setEditId(s.id);
    setConfirmDel(null);
  };

  const saveEdit = id => {
    const mins = durToMins(editForm.durD, editForm.durH, editForm.durM);
    if (mins <= 0) return;
    onUpdate(id, { project: editForm.project, date: editForm.date, durationMins: mins, notes: editForm.notes });
    setEditId(null);
  };

  const submit = () => {
    const mins = durToMins(form.durD, form.durH, form.durM);
    if (mins <= 0) return;
    const entry = { project: form.project, date: form.date, durationMins: mins, notes: form.notes, id: uid(), createdAt: Date.now() };
    onAdd(entry);
    if (form.addToTl) {
      onAddTl({
        id: uid(), date: form.date, category: 'session',
        title: form.project,
        body: minsToHours(mins) + (form.notes ? ' — ' + form.notes : ''),
        themes: [], createdAt: Date.now(),
      });
    }
    setForm(blankForm);
  };

  const totalMins = sessions.reduce((s, x) => s + (Number(x.durationMins) || 0), 0);
  const minsFor = p => sessions.filter(s => s.project === p).reduce((s, x) => s + (Number(x.durationMins) || 0), 0);
  const sorted = [...sessions].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <div className="ses-overview">
        <div>
          <div className="section-eyebrow">Sessions</div>
          <span className="tl-count">{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} logged</span>
        </div>
        <div className="ses-grand-total">
          <div className="ses-grand-hrs">{minsToHours(totalMins)}</div>
          <div className="ses-grand-label">Total across all projects</div>
        </div>
      </div>

      <div className="ses-projects-grid">
        {PROJECTS.map(p => (
          <div className="ses-project-card" key={p}>
            <div className="ses-project-name">{p}</div>
            <div className="ses-project-hrs">{minsToHours(minsFor(p))}</div>
            <div className="ses-project-unit">logged</div>
          </div>
        ))}
      </div>

      <div className="ses-add-card">
        <div className="section-eyebrow" style={{ marginBottom: 12 }}>Log a session</div>
        <div className="ses-form-grid">
          <div>
            <div className="form-label">Project</div>
            <select className="form-select" value={form.project} onChange={e => f('project', e.target.value)}>
              {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <div className="form-label">Date</div>
            <input className="form-input" type="date" value={form.date} onChange={e => f('date', e.target.value)} />
          </div>
        </div>
        <div className="ses-dur-row">
          <div>
            <div className="form-label">Days</div>
            <input className="form-input" type="number" min="0" placeholder="0" value={form.durD} onChange={e => f('durD', e.target.value)} />
          </div>
          <div>
            <div className="form-label">Hours</div>
            <input className="form-input" type="number" min="0" max="23" placeholder="0" value={form.durH} onChange={e => f('durH', e.target.value)} />
          </div>
          <div>
            <div className="form-label">Minutes</div>
            <input className="form-input" type="number" min="0" max="59" placeholder="0" value={form.durM} onChange={e => f('durM', e.target.value)} />
          </div>
        </div>
        <div className="ses-form-footer">
          <div className="ses-form-notes">
            <input className="form-input" placeholder="Notes (optional)" value={form.notes} onChange={e => f('notes', e.target.value)} style={{ flex: 1 }} />
          </div>
          <label className="ses-toggle">
            <input type="checkbox" checked={form.addToTl} onChange={e => f('addToTl', e.target.checked)} />
            Add to Timeline
          </label>
          <button className="btn btn-primary" onClick={submit}>Log →</button>
        </div>
      </div>

      <hr className="divider" />
      <div className="section-eyebrow">{sorted.length > 0 ? 'All sessions — newest first' : 'No sessions logged yet'}</div>

      {sorted.length > 0 && (
        <div className="ses-list">
          {sorted.map(s => editId === s.id ? (
            <div className="ses-item ses-item-editing" key={s.id}>
              <div className="ses-edit-row">
                <div>
                  <div className="form-label">Project</div>
                  <select className="form-select" value={editForm.project} onChange={e => ef('project', e.target.value)}>
                    {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <div className="form-label">Date</div>
                  <input className="form-input" type="date" value={editForm.date} onChange={e => ef('date', e.target.value)} />
                </div>
              </div>
              <div className="ses-dur-row">
                <div>
                  <div className="form-label">Days</div>
                  <input className="form-input" type="number" min="0" placeholder="0" value={editForm.durD} onChange={e => ef('durD', e.target.value)} />
                </div>
                <div>
                  <div className="form-label">Hours</div>
                  <input className="form-input" type="number" min="0" max="23" placeholder="0" value={editForm.durH} onChange={e => ef('durH', e.target.value)} />
                </div>
                <div>
                  <div className="form-label">Minutes</div>
                  <input className="form-input" type="number" min="0" max="59" placeholder="0" value={editForm.durM} onChange={e => ef('durM', e.target.value)} />
                </div>
              </div>
              <input className="form-input" placeholder="Notes (optional)" value={editForm.notes} onChange={e => ef('notes', e.target.value)} style={{ marginBottom: 10 }} />
              <div className="ses-edit-footer">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={() => saveEdit(s.id)}>Save</button>
              </div>
            </div>
          ) : (
            <div className="ses-item" key={s.id}>
              <span className="ses-item-project">{s.project}</span>
              <span className="ses-item-date">{fmtDate(s.date)}</span>
              <span className="ses-item-dur">{minsToHours(s.durationMins)}</span>
              <span className="ses-item-notes">{s.notes || '—'}</span>
              <div className="ses-item-actions">
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEdit(s)} title="Edit">✎</button>
                {confirmDel === s.id ? (
                  <>
                    <button className="btn btn-ghost btn-sm" style={{ color: '#E86161', fontSize: 11 }} onClick={() => { onDelete(s.id); setConfirmDel(null); }}>Confirm?</button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setConfirmDel(null)}>✕</button>
                  </>
                ) : (
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setConfirmDel(s.id)} title="Delete">🗑</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
