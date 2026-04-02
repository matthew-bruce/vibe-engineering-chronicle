import { useState } from 'react';
import { today, uid } from '../constants.js';

export default function QuickCapture({ onAdd }) {
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [source, setSource] = useState('');
  const [date, setDate] = useState(today());

  const reset = () => {
    setText('');
    setSource('');
    setDate(today());
    setExpanded(false);
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd({
      id: uid(),
      createdAt: Date.now(),
      title: trimmed,
      body: source.trim() ? `Source: ${source.trim()}` : '',
      date,
      category: 'capture',
      themes: [],
      benefit: '',
      impact: null,
      audience: null,
      sections: [],
    });
    reset();
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Escape') {
      reset();
    }
  };

  return (
    <div className="qc-wrap">
      <div className="qc-row">
        <input
          className="qc-input"
          placeholder="Capture a thought, quote or insight…"
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={handleKeyDown}
        />
        {expanded && (
          <button className="btn btn-primary btn-sm qc-btn" onClick={submit}>
            Capture
          </button>
        )}
      </div>
      {expanded && (
        <div className="qc-extra">
          <input
            className="qc-sub-input"
            placeholder="Source / attribution (optional)"
            value={source}
            onChange={e => setSource(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            className="qc-sub-input qc-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="btn btn-ghost btn-sm qc-cancel" onClick={reset}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
