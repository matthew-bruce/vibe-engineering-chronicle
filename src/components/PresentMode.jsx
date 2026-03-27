import { useState, useEffect, useRef, useCallback } from 'react';
import { cats } from '../../lib/cats.js';
import { TEMPLATE_REGISTRY, scoreCard, thumbScrollDelta } from '../lib/slideTemplates.jsx';

export default function PresentMode({ entries, startIndex = 0, onClose }) {
  const [idx, setIdx]             = useState(startIndex);
  const [detailMode, setDetailMode] = useState(false);
  const [thumbsOpen, setThumbsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exitView, setExitView]   = useState(false);
  const thumbsRef    = useRef(null);
  const activeThumbRef = useRef(null);

  const n = entries.length;
  const entry = entries[idx];

  // ── Fullscreen ─────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = e => {
      if (exitView) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
        setIdx(i => Math.min(i + 1, n - 1));
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
        setIdx(i => Math.max(i - 1, 0));
      else if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen();
        else onClose();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [n, onClose, exitView]);

  // ── Thumbnail auto-scroll ──────────────────────────────────────────────────
  useEffect(() => {
    if (!thumbsOpen || !activeThumbRef.current || !thumbsRef.current) return;
    const delta = thumbScrollDelta(
      thumbsRef.current.getBoundingClientRect(),
      activeThumbRef.current.getBoundingClientRect(),
    );
    if (delta !== 0) thumbsRef.current.scrollLeft += delta;
  }, [idx, thumbsOpen]);

  if (!entry) return null;

  const pct = n > 1 ? (idx / (n - 1)) * 100 : 100;
  const templateSlug = scoreCard(entry, detailMode);
  const renderer = TEMPLATE_REGISTRY[templateSlug] ?? TEMPLATE_REGISTRY['standard'];

  // ── Exit view ──────────────────────────────────────────────────────────────
  if (exitView) {
    return (
      <div className="pm-overlay">
        <div className="pm-exit-view">
          <div className="pm-exit-header">
            <button className="pm-exit-back" onClick={onClose}>← Back to timeline</button>
            <span className="pm-exit-heading">
              Presentation complete — {n} {n === 1 ? 'card' : 'cards'}
            </span>
          </div>
          <div className="pm-exit-list">
            {entries.map((e, i) => {
              const cat = cats[e.category] || cats.wow;
              return (
                <button
                  key={e.id}
                  className="pm-exit-card"
                  onClick={() => { setIdx(i); setExitView(false); }}
                >
                  <span className="pm-exit-num">{i + 1}</span>
                  <div className="pm-exit-card-body">
                    <span
                      className="pm-exit-cat-pill"
                      style={{ background: cat.color + '22', color: cat.color }}
                    >{cat.glyph} {cat.label}</span>
                    <div className="pm-exit-card-title">{e.title}</div>
                    {(e.themes || []).length > 0 && (
                      <div className="pm-exit-themes">
                        {(e.themes || []).map(id => (
                          <span key={id} className="pm-exit-theme-pill">{id}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Main presentation view ─────────────────────────────────────────────────
  return (
    <div className="pm-overlay">

      {/* TOP BAR */}
      <div className="pm-top-bar">
        <div className="pm-wordmark">Chronicle · Present</div>
        <div className="pm-mode-toggle">
          <button
            className={`pm-toggle-btn${!detailMode ? ' active' : ''}`}
            onClick={() => setDetailMode(false)}
          >Standard</button>
          <button
            className={`pm-toggle-btn${detailMode ? ' active' : ''}`}
            onClick={() => setDetailMode(true)}
          >Detailed</button>
        </div>
        <div className="pm-top-right">
          <button
            className="pm-icon-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >{isFullscreen ? '⤡' : '⤢'}</button>
          <button className="pm-exit-btn" onClick={() => setExitView(true)}>✕ Exit</button>
        </div>
      </div>

      {/* SLIDE CONTENT — scrollable */}
      <div className="pm-slide-area">
        <div className="pm-slide-wrap" key={`${entry.id}-${templateSlug}`}>
          {renderer(entry)}
        </div>
      </div>

      {/* THUMBNAIL STRIP — accordion */}
      {thumbsOpen && (
        <div className="pm-thumbs">
          <div className="pm-thumbs-scroll" ref={thumbsRef}>
            {entries.map((e, i) => {
              const cat = cats[e.category] || cats.wow;
              const isActive = i === idx;
              return (
                <button
                  key={e.id}
                  ref={isActive ? activeThumbRef : null}
                  className={`pm-thumb${isActive ? ' active' : ''}`}
                  onClick={() => setIdx(i)}
                >
                  <div className="pm-thumb-num">{i + 1}</div>
                  <span
                    className="pm-thumb-cat"
                    style={{ background: cat.color + '22', color: cat.color }}
                  >{cat.glyph}</span>
                  <div className="pm-thumb-title">{e.title}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* BOTTOM BAR */}
      <div className="pm-bottom-bar">
        <button
          className="pm-nav-btn"
          onClick={() => setIdx(i => Math.max(i - 1, 0))}
          disabled={idx === 0}
          aria-label="Previous slide"
        >←</button>

        <div className="pm-progress-wrap">
          <div className="pm-progress-track">
            <div className="pm-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="pm-progress-label">{idx + 1} of {n} {n === 1 ? 'card' : 'cards'}</div>
        </div>

        <button
          className="pm-nav-btn"
          onClick={() => setIdx(i => Math.min(i + 1, n - 1))}
          disabled={idx === n - 1}
          aria-label="Next slide"
        >→</button>

        <button className="pm-thumbs-toggle" onClick={() => setThumbsOpen(s => !s)}>
          {thumbsOpen ? '▼ Slides' : '▲ Slides'}
        </button>
        <button className="pm-exit-btn" onClick={() => setExitView(true)}>✕ Exit</button>
      </div>
    </div>
  );
}
