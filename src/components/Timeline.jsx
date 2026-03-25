import { useState } from 'react';
import { CATS, THEMES, uid, fmtDate } from '../constants.js';
import CardForm, { blankForm } from './CardForm.jsx';

export default function Timeline({ entries, allCount, filterCat, setFilterCat, onAdd, onUpdate, onDelete }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);

  const submit = () => {
    if (!form.title.trim()) return;
    onAdd({ ...form, id: uid(), createdAt: Date.now() });
    setForm(blankForm);
    setShow(false);
  };

  const startEdit = (e) => {
    setEditForm({ title: e.title, body: e.body || '', date: e.date, category: e.category, themes: e.themes || [], benefit: e.benefit || '' });
    setEditId(e.id);
    setConfirmDel(null);
    setShow(false);
  };

  const saveEdit = () => {
    if (!editForm.title.trim()) return;
    setEditId(null);
    onUpdate(editId, editForm);
  };

  return (
    <div>
      <div className="tl-header">
        <div>
          <div className="section-eyebrow">Personal Chronicle</div>
          <span className="tl-count">{allCount} {allCount === 1 ? 'entry' : 'entries'}</span>
        </div>
        <button className="btn btn-primary" onClick={() => { setShow(s => !s); setEditId(null); }}>
          {show ? '✕ Cancel' : '+ Add Entry'}
        </button>
      </div>

      {show && (
        <div className="form-card">
          <CardForm form={form} onChange={(k, v) => setForm(p => ({ ...p, [k]: v }))} />
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>Add to Timeline</button>
          </div>
        </div>
      )}

      <div className="filter-row">
        <button className={`fchip ${filterCat === 'all' ? 'on' : ''}`} onClick={() => setFilterCat('all')}>All</button>
        {Object.entries(CATS).map(([k, v]) => (
          <button key={k} className={`fchip ${filterCat === k ? 'on' : ''}`} onClick={() => setFilterCat(k)}
            style={filterCat === k ? { borderColor: v.color, color: v.color } : {}}
          >{v.glyph} {v.label}</button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="empty">
          <div className="empty-title">The journey starts here.</div>
          <div className="empty-sub">Add your first entry — when did you first encounter vibe coding? What tool did you pick up first?</div>
          <button className="btn btn-primary" onClick={() => setShow(true)}>+ Add First Entry</button>
        </div>
      ) : (
        <div className="tl-list">
          {entries.map(e => {
            const cat = CATS[e.category] || CATS.wow;
            const isEditing = editId === e.id;
            const editCat = isEditing ? (CATS[editForm.category] || cat) : cat;
            return (
              <div className="tl-entry" key={e.id}>
                <div className="tl-dot-wrap">
                  <div className="tl-dot" style={{ background: isEditing ? editCat.color : cat.color }} />
                </div>
                {isEditing ? (
                  <div className="tl-body" style={{ borderLeftColor: editCat.color }}>
                    <CardForm form={editForm} onChange={(k, v) => setEditForm(p => ({ ...p, [k]: v }))} />
                    <div className="form-actions">
                      <button className="btn btn-ghost" onClick={() => setEditId(null)}>Cancel</button>
                      <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
                    </div>
                  </div>
                ) : (
                  <div className="tl-body" style={{ borderLeftColor: cat.color }}>
                    <div className="tl-head-row">
                      <div className="tl-meta">
                        <span className="tl-date">{fmtDate(e.date)}</span>
                        <span className="tl-cat-badge" style={{ background: cat.color + '22', color: cat.color }}>{cat.glyph} {cat.label}</span>
                      </div>
                      <div className="tl-actions">
                        {confirmDel === e.id ? (
                          <>
                            <button className="btn btn-ghost btn-sm" style={{ color: '#E86161', fontSize: 11 }} onClick={() => { onDelete(e.id); setConfirmDel(null); }}>Delete?</button>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setConfirmDel(null)}>✕</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => startEdit(e)}>✎</button>
                            <button className="btn btn-ghost btn-sm btn-icon" title="Delete" onClick={() => setConfirmDel(e.id)}>🗑</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="tl-title">{e.title}</div>
                    {e.body && <div className="tl-text">{e.body}</div>}
                    {(e.themes || []).length > 0 && (
                      <div className="theme-pills">
                        {(e.themes || []).map(id => {
                          const t = THEMES.find(x => x.id === id);
                          return t ? (
                            <span key={id} className="theme-pill" style={{ background: t.color + '22', color: t.color }}>{t.label}</span>
                          ) : null;
                        })}
                      </div>
                    )}
                    {e.benefit && (
                      <div className="tl-benefit">
                        <div className="tl-benefit-label">Benefit</div>
                        <div className="tl-benefit-text">{e.benefit}</div>
                      </div>
                    )}
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
