import { useState } from 'react';
import { THEMES, toggleTheme, uid } from '../constants.js';

export default function Capture({ entries, onAdd, onDelete, onPromote }) {
  const [form, setForm] = useState({ text: '', source: '', themes: [] });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.text.trim()) return;
    onAdd({ ...form, id: uid(), createdAt: Date.now() });
    setForm({ text: '', source: '', themes: [] });
  };

  return (
    <div>
      <div className="tl-header">
        <div>
          <div className="section-eyebrow">Quick Capture</div>
          <span className="tl-count">Ideas, quotes, and observations to come back to</span>
        </div>
      </div>

      <div className="cap-input-area">
        <div style={{ marginBottom: 8 }}>
          <div className="form-label">Capture a thought, quote, or insight</div>
          <textarea
            className="form-textarea"
            placeholder={'"The best code is the code you didn\'t write." — or your own observation, link, or idea...'}
            value={form.text}
            onChange={e => f('text', e.target.value)}
            style={{ minHeight: 72 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="form-input"
            placeholder="Source / attribution (optional)"
            value={form.source}
            onChange={e => f('source', e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={submit}>Capture →</button>
        </div>
        <div style={{ marginTop: 8 }}>
          <div className="form-label" style={{ marginBottom: 5 }}>Themes</div>
          <div className="theme-select-row">
            {THEMES.map(t => (
              <button
                key={t.id}
                className={`theme-chip ${form.themes.includes(t.id) ? 'selected' : ''}`}
                style={form.themes.includes(t.id)
                  ? { background: t.color, borderColor: t.color, color: '#fff' }
                  : { borderColor: t.color + '66', color: t.color }}
                onClick={() => f('themes', toggleTheme(form.themes, t.id))}
              >{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <hr className="divider" />
      <div className="section-eyebrow">
        {entries.length} captured{entries.length > 0 ? ' — promote anything significant to the Timeline' : ''}
      </div>

      {entries.length === 0 ? (
        <div className="empty">
          <div className="empty-title">Nothing captured yet.</div>
          <div className="empty-sub">Heard something interesting? Saw a tweet? Had a lightbulb moment? Drop it here before it disappears.</div>
        </div>
      ) : (
        <div className="cap-grid">
          {entries.map(e => (
            <div className="cap-card" key={e.id}>
              <div className="cap-text">"{e.text}"</div>
              {e.source && <div className="cap-source">— {e.source}</div>}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <span className="cap-card-time">{new Date(e.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                <div className="cap-card-actions">
                  <button className="btn btn-ghost btn-sm" title="Promote to timeline" onClick={() => onPromote(e)}>↑ Timeline</button>
                  <button className="btn btn-ghost btn-sm btn-icon" title="Delete" onClick={() => onDelete(e.id)}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
