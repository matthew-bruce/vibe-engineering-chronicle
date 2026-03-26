import { useState, useEffect } from 'react';
import { fmtDate } from '../constants.js';
import { cats } from '../../lib/cats.js';

export default function PresentMode({ entries, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const [detailMode, setDetailMode] = useState(false);
  const entry = entries[idx];
  const cat = entry ? cats[entry.category] : null;

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ')
        setIdx(i => Math.min(i + 1, entries.length - 1));
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
        setIdx(i => Math.max(i - 1, 0));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [entries.length, onClose]);

  if (!entry) return null;
  const pct = entries.length > 1 ? (idx / (entries.length - 1)) * 100 : 100;

  return (
    <div className="present-overlay">
      <div className="present-progress">
        <div className="present-progress-bar" style={{ width: `${pct}%` }} />
      </div>
      <div className="present-body">
        <div className="present-card" key={entry.id}>
          <div className="present-cat">
            <span className="present-cat-glyph">{cat.glyph}</span>
            <span className="present-cat-label" style={{ color: cat.color }}>{cat.label}</span>
          </div>
          <div className="present-date">{fmtDate(entry.date)}</div>
          <div className="present-title" style={detailMode ? { fontSize: 'clamp(22px,3.2vw,38px)' } : {}}>{entry.title}</div>
          {entry.body && <div className="present-text">{entry.body}</div>}
          {detailMode && (entry.sections || []).length > 0 && (
            <div className="present-sections">
              {(entry.sections || []).map(s => (
                <div key={s.id} className="present-section">
                  <div className="present-section-label">{s.label}</div>
                  {s.body && <div className="present-section-body">{s.body}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="present-footer">
        <button className="btn-close" onClick={onClose}>✕ Close</button>
        <span className="present-counter">{idx + 1} / {entries.length}</span>
        <div className="present-nav">
          <button
            className={`btn-close ${detailMode ? 'present-detail-on' : ''}`}
            onClick={() => setDetailMode(m => !m)}
            title="Toggle detailed view"
          >{detailMode ? '⊟ Standard' : '⊞ Detailed'}</button>
          <span className="present-hint">← → or click</span>
          <button className="btn-nav" onClick={() => setIdx(i => Math.max(i - 1, 0))} disabled={idx === 0}>←</button>
          <button className="btn-nav" onClick={() => setIdx(i => Math.min(i + 1, entries.length - 1))} disabled={idx === entries.length - 1}>→</button>
        </div>
      </div>
    </div>
  );
}
