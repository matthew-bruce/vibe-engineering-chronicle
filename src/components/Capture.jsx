import { useState } from 'react';
import { uid, today } from '../constants.js';

export default function Capture({ onAdd }) {
  const blank = () => ({ title: '', body: '', source: '', date: today() });
  const [form, setForm] = useState(blank);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.title.trim()) return;
    onAdd({
      id: uid(),
      title: form.title.trim(),
      body: form.body.trim() || null,
      source: form.source.trim() || null,
      date: form.date,
      category: 'capture',
      themes: [],
      benefit: '',
      impact: null,
      audience: null,
      createdAt: Date.now(),
    });
    setForm(blank);
  };

  return (
    <div>
      <div className="tl-header">
        <div>
          <div className="section-eyebrow">Quick Capture</div>
          <span className="tl-count">Fast entry — goes straight to the timeline</span>
        </div>
      </div>

      <div className="form-card">
        <div className="form-grid">
          <div className="form-grid-full">
            <div className="form-label">Title *</div>
            <input
              className="form-input"
              placeholder="What did you capture? A quote, observation, idea…"
              value={form.title}
              onChange={e => f('title', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </div>
          <div className="form-grid-full">
            <div className="form-label">Notes <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></div>
            <textarea
              className="form-textarea"
              placeholder="Extra context, detail, or why this matters…"
              value={form.body}
              onChange={e => f('body', e.target.value)}
              style={{ minHeight: 64 }}
            />
          </div>
          <div>
            <div className="form-label">Source / attribution <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></div>
            <input
              className="form-input"
              placeholder="e.g. @simonw, podcast, conversation"
              value={form.source}
              onChange={e => f('source', e.target.value)}
            />
          </div>
          <div>
            <div className="form-label">Date</div>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={e => f('date', e.target.value)}
            />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => setForm(blank)}>Clear</button>
          <button className="btn btn-primary" onClick={submit}>Add to Timeline →</button>
        </div>
      </div>
    </div>
  );
}
