import { useState, useEffect } from 'react';
import { THEMES, CARD_FORMATS, uid, fmtDate } from '../constants.js';
import { cats } from '../../lib/cats.js';
import CardForm, { blankForm } from './CardForm.jsx';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function CardSource({ source }) {
  if (!source) return null;
  const isUrl = /^https?:\/\//i.test(source);
  if (isUrl) {
    return (
      <div className="tl-source">
        <a href={source} target="_blank" rel="noopener noreferrer" className="tl-source-link">
          ↗ {source}
        </a>
      </div>
    );
  }
  return (
    <div className="tl-source">
      <span className="tl-source-text">⌁ {source}</span>
    </div>
  );
}

function Highlight({ text, term }) {
  if (!term || !text) return text;
  const parts = text.split(new RegExp(`(${escapeRegex(term)})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase()
      ? <mark key={i} className="search-hl">{part}</mark>
      : part
  );
}

export default function Timeline({ entries, allCount, filterCat, setFilterCat, filterTheme, setFilterTheme, filterFormat, setFilterFormat, onAdd, onUpdate, onDelete, viewMode = 'standard' }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);
  const [searchRaw, setSearchRaw] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchRaw.trim()), 300);
    return () => clearTimeout(t);
  }, [searchRaw]);

  const submit = () => {
    if (!form.title.trim()) return;
    onAdd({ ...form, id: uid(), createdAt: Date.now() });
    setForm(blankForm);
    setShow(false);
  };

  const startEdit = (e) => {
    setEditForm({ title: e.title, body: e.body || '', date: e.date, category: e.category, themes: e.themes || [], benefit: e.benefit || '', impact: e.impact ?? null, audience: e.audience ?? null, sections: e.sections || [] });
    setEditId(e.id);
    setConfirmDel(null);
    setShow(false);
  };

  const saveEdit = () => {
    if (!editForm.title.trim()) return;
    setEditId(null);
    onUpdate(editId, editForm);
  };

  const q = searchTerm.toLowerCase();
  const visible = searchTerm
    ? entries.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.body  || '').toLowerCase().includes(q) ||
        (e.benefit || '').toLowerCase().includes(q)
      )
    : entries;

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

      <div className="tl-search-wrap">
        <input
          className="tl-search-input"
          placeholder="Search title, notes, benefit…"
          value={searchRaw}
          onChange={e => setSearchRaw(e.target.value)}
        />
        {searchRaw && (
          <button className="tl-search-clear" onClick={() => { setSearchRaw(''); setSearchTerm(''); }} title="Clear search">✕</button>
        )}
      </div>

      <div className="filter-row">
        <button className={`fchip ${filterCat === 'all' ? 'on' : ''}`} onClick={() => setFilterCat('all')}>All</button>
        {Object.entries(cats).map(([k, v]) => (
          <button key={k} className={`fchip ${filterCat === k ? 'on' : ''}`} onClick={() => setFilterCat(k)}
            style={filterCat === k ? { borderColor: v.color, color: v.color } : {}}
          >{v.glyph} {v.label}</button>
        ))}
      </div>
      <div className="filter-row filter-row-themes">
        <button className={`fchip fchip-sm ${filterTheme === 'all' ? 'on' : ''}`} onClick={() => setFilterTheme('all')}>All themes</button>
        {THEMES.map(t => (
          <button key={t.id} className={`fchip fchip-sm ${filterTheme === t.id ? 'on' : ''}`} onClick={() => setFilterTheme(t.id)}
            style={filterTheme === t.id ? { borderColor: t.color, color: t.color } : {}}
          >{t.label}</button>
        ))}
      </div>
      <div className="filter-row filter-row-themes">
        <button className={`fchip fchip-sm ${filterFormat === 'all' ? 'on' : ''}`} onClick={() => setFilterFormat('all')}>All formats</button>
        {CARD_FORMATS.map(f => (
          <button key={f.value} className={`fchip fchip-sm ${filterFormat === f.value ? 'on' : ''}`} onClick={() => setFilterFormat(f.value)}
          >{f.label}</button>
        ))}
      </div>

      {searchTerm && (
        <div className="tl-search-summary">
          {visible.length} {visible.length === 1 ? 'result' : 'results'} for <strong>"{searchTerm}"</strong>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="empty">
          {searchTerm ? (
            <>
              <div className="empty-title">No results found.</div>
              <div className="empty-sub">Try a different search term or clear the filter.</div>
            </>
          ) : (
            <>
              <div className="empty-title">The journey starts here.</div>
              <div className="empty-sub">Add your first entry — when did you first encounter vibe coding? What tool did you pick up first?</div>
              <button className="btn btn-primary" onClick={() => setShow(true)}>+ Add First Entry</button>
            </>
          )}
        </div>
      ) : (
        <div className="tl-list">
          {visible.map(e => {
            const cat = cats[e.category] || cats.wow;
            const isEditing = editId === e.id;
            const editCat = isEditing ? (cats[editForm.category] || cat) : cat;
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
                        <button className="tl-cat-badge tl-cat-badge-btn" style={{ background: cat.color + '22', color: cat.color }} onClick={() => setFilterCat(e.category)} title={`Filter by ${cat.label}`}>{cat.glyph} {cat.label}</button>
                        {viewMode === 'detailed' && e.impact && (
                          <span className="tl-impact-dots" title={`Impact ${e.impact}/5`}>
                            {[1,2,3,4,5].map(n => (
                              <span key={n} className={`tl-impact-dot ${n <= e.impact ? 'filled' : ''}`} />
                            ))}
                          </span>
                        )}
                        {e.audience && (
                          <span className="tl-audience-pill">{e.audience}</span>
                        )}
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
                    <div className="tl-title"><Highlight text={e.title} term={searchTerm} /></div>
                    {e.body && <div className="tl-text"><Highlight text={e.body} term={searchTerm} /></div>}
                    {(e.themes || []).length > 0 && (
                      <div className="theme-pills">
                        {(e.themes || []).map(id => {
                          const t = THEMES.find(x => x.id === id);
                          return t ? (
                            <button key={id} className="theme-pill theme-pill-btn" style={{ background: t.color + '22', color: t.color }} onClick={() => setFilterTheme(id)} title={`Filter by ${t.label}`}>{t.label}</button>
                          ) : null;
                        })}
                      </div>
                    )}
                    <CardSource source={e.source} />
                    {e.benefit && (
                      <div className="tl-benefit">
                        <div className="tl-benefit-label">Benefit</div>
                        <div className="tl-benefit-text"><Highlight text={e.benefit} term={searchTerm} /></div>
                      </div>
                    )}
                    {viewMode === 'detailed' && (e.sections || []).length > 0 && (
                      <div className="tl-sections">
                        {(e.sections || []).map(s => (
                          <div key={s.id} className="tl-section">
                            <div className="tl-section-label">{s.label}</div>
                            {s.body && <div className="tl-section-body">{s.body}</div>}
                          </div>
                        ))}
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
