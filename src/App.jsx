import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, Navigate, useSearchParams } from 'react-router-dom';
import {
  initLookups,
  loadTimeline, loadSessions,
  addTimelineEntry, updateTimelineEntry, softDeleteCard,
  addSession, updateSession, softDeleteSession,
} from '../lib/db.js';
import { THEMES } from './constants.js';
import { cats } from '../lib/cats.js';
import CSS from './styles.js';
import PresentMode from './components/PresentMode.jsx';
import Timeline from './components/Timeline.jsx';
import Sessions from './components/Sessions.jsx';
import Projects from './components/Projects.jsx';

export default function App() {
  const [tl, setTl] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [presenting, setPresenting] = useState(false);
  const [showPfPanel, setShowPfPanel] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const filterCat   = searchParams.get('category') || 'all';
  const filterTheme = searchParams.get('theme')    || 'all';
  const [pfCats, setPfCats] = useState([]);
  const [pfThemes, setPfThemes] = useState(() => THEMES.map(t => t.id));
  const [pfSignalOnly, setPfSignalOnly] = useState(false);
  const [viewMode, setViewMode] = useState('standard');

  useEffect(() => {
    async function boot() {
      try {
        await initLookups();
        setPfCats(Object.keys(cats));
        const [tlData, sesData] = await Promise.all([
          loadTimeline(),
          loadSessions(),
        ]);
        setTl(tlData);
        setSessions(sesData);
      } catch (err) {
        console.error('[Chronicle] Supabase load failed:', err);
        setLoadError(err.message ?? 'Failed to connect to database.');
      } finally {
        setReady(true);
      }
    }
    boot();
  }, []);

  const addTl = useCallback(async entry => {
    try {
      const saved = await addTimelineEntry(entry);
      setTl(p => [...p, saved]);
    } catch (err) { console.error('[Chronicle] addTl failed:', err); }
  }, []);

  const updateTl = useCallback(async (id, fields) => {
    try {
      await updateTimelineEntry(id, fields);
      setTl(p => p.map(e => e.id === id ? { ...e, ...fields } : e));
    } catch (err) { console.error('[Chronicle] updateTl failed:', err); }
  }, []);

  const delTl = useCallback(async id => {
    try {
      await softDeleteCard(id);
      setTl(p => p.filter(e => e.id !== id));
    } catch (err) { console.error('[Chronicle] delTl failed:', err); }
  }, []);

  const addSes = useCallback(async entry => {
    try {
      const saved = await addSession(entry);
      setSessions(p => [...p, saved]);
    } catch (err) { console.error('[Chronicle] addSes failed:', err); }
  }, []);

  const delSes = useCallback(async id => {
    try {
      await softDeleteSession(id);
      setSessions(p => p.filter(s => s.id !== id));
    } catch (err) { console.error('[Chronicle] delSes failed:', err); }
  }, []);

  const updateSes = useCallback(async (id, fields) => {
    try {
      await updateSession(id, fields);
      setSessions(p => p.map(s => s.id === id ? { ...s, ...fields } : s));
    } catch (err) { console.error('[Chronicle] updateSes failed:', err); }
  }, []);

  const setFilterCat = useCallback(slug => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (slug === 'all') next.delete('category'); else next.set('category', slug);
      return next;
    });
  }, [setSearchParams]);

  const setFilterTheme = useCallback(slug => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (slug === 'all') next.delete('theme'); else next.set('theme', slug);
      return next;
    });
  }, [setSearchParams]);

  const byDateDesc = (a, b) =>
    new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt;

  const sorted = [...tl]
    .filter(e => {
      if (filterCat !== 'all' && e.category !== filterCat) return false;
      if (filterTheme !== 'all' && !(e.themes || []).includes(filterTheme)) return false;
      return true;
    })
    .sort(byDateDesc);

  const allSorted = [...tl].sort((a, b) =>
    new Date(a.date) - new Date(b.date) || a.createdAt - b.createdAt);
  const presentFiltered = allSorted.filter(e => {
    if (!pfCats.includes(e.category)) return false;
    if (pfSignalOnly && !(e.themes || []).includes('signal')) return false;
    const et = e.themes || [];
    if (pfThemes.length < THEMES.length && et.length > 0 && !et.some(t => pfThemes.includes(t))) return false;
    return true;
  });

  const togglePfCat = k => setPfCats(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  const togglePfTheme = id => setPfThemes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  if (!ready) return (
    <div style={{ background: '#ffffff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontFamily: 'monospace', fontSize: 13 }}>
      connecting…
    </div>
  );

  if (loadError) return (
    <div style={{ background: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#E86161', fontFamily: 'monospace', fontSize: 13 }}>
      <div style={{ fontSize: 22 }}>⚠</div>
      <div>Database connection failed</div>
      <div style={{ color: '#9ca3af', fontSize: 11 }}>{loadError}</div>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      {presenting && presentFiltered.length > 0 && (
        <PresentMode entries={presentFiltered} startIndex={0} onClose={() => setPresenting(false)} />
      )}
      <div className="app">
        <header className="hdr">
          <div className="hdr-left">
            <div className="hdr-glyph">⟡</div>
            <div>
              <div className="hdr-title">Chronicle</div>
              <div className="hdr-sub">{tl.length} {tl.length === 1 ? 'card' : 'cards'}</div>
            </div>
          </div>
          <div className="hdr-right">
            {tl.length > 0 && (
              <div className="pf-anchor">
                <button
                  className={`btn btn-ghost btn-sm ${viewMode === 'detailed' ? 'view-toggle-on' : ''}`}
                  onClick={() => setViewMode(m => m === 'standard' ? 'detailed' : 'standard')}
                  title="Toggle standard / detailed view"
                >{viewMode === 'detailed' ? '⊟ Standard' : '⊞ Detailed'}</button>
                <button
                  className={`btn btn-filter btn-sm ${showPfPanel ? 'on' : ''}`}
                  onClick={() => setShowPfPanel(s => !s)}
                >⊞ Filter</button>
                <button className="btn btn-present" onClick={() => { setShowPfPanel(false); setPresenting(true); }}>▶ Present</button>
                {showPfPanel && (
                  <div className="pf-panel">
                    <div className="pf-section">
                      <div className="pf-section-label">Categories</div>
                      <div className="pf-chips">
                        {(() => {
                          const allCatKeys = Object.keys(cats);
                          const allOn = allCatKeys.every(k => pfCats.includes(k));
                          return (
                            <button
                              className={`pf-chip ${allOn ? 'on' : ''}`}
                              onClick={() => setPfCats(allOn ? [] : allCatKeys)}
                            >All Categories</button>
                          );
                        })()}
                        {Object.entries(cats).map(([k, v]) => (
                          <button key={k} className={`pf-chip ${pfCats.includes(k) ? 'on' : ''}`}
                            style={pfCats.includes(k) ? { borderColor: v.color, color: v.color } : {}}
                            onClick={() => togglePfCat(k)}
                          >{v.glyph} {v.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="pf-section">
                      <div className="pf-section-label">Themes</div>
                      <div className="pf-chips">
                        {(() => {
                          const allOn = THEMES.every(t => pfThemes.includes(t.id));
                          return (
                            <button
                              className={`pf-chip ${allOn ? 'on' : ''}`}
                              onClick={() => setPfThemes(allOn ? [] : THEMES.map(t => t.id))}
                            >All Themes</button>
                          );
                        })()}
                        {THEMES.map(t => (
                          <button key={t.id} className={`pf-chip ${pfThemes.includes(t.id) ? 'on' : ''}`}
                            style={pfThemes.includes(t.id) ? { borderColor: t.color, color: t.color } : {}}
                            onClick={() => togglePfTheme(t.id)}
                          >{t.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="pf-section" style={{ marginBottom: 0 }}>
                      <div className="pf-chips">
                        <button className={`pf-chip ${pfSignalOnly ? 'on' : ''}`}
                          style={pfSignalOnly ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
                          onClick={() => setPfSignalOnly(s => !s)}
                        >⚡ Signal entries only</button>
                      </div>
                    </div>
                    <div className="pf-footer">
                      <span className="pf-count">{presentFiltered.length} of {tl.length} entries selected</span>
                      <button
                        className="btn btn-present btn-sm"
                        disabled={presentFiltered.length === 0}
                        onClick={() => { setShowPfPanel(false); setPresenting(true); }}
                      >▶ Present selected ({presentFiltered.length})</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <nav className="tabs">
              <NavLink className={({ isActive }) => `tab${isActive ? ' on' : ''}`} to="/timeline" end>Timeline</NavLink>
              <NavLink className={({ isActive }) => `tab${isActive ? ' on' : ''}`} to="/sessions">Sessions</NavLink>
              <NavLink className={({ isActive }) => `tab${isActive ? ' on' : ''}`} to="/projects">Projects</NavLink>
            </nav>
          </div>
        </header>
        <main className="main">
          <Routes>
            <Route index element={<Navigate to="/timeline" replace />} />
            <Route path="/timeline" element={
              <Timeline
                entries={sorted}
                allCount={tl.length}
                filterCat={filterCat}
                setFilterCat={setFilterCat}
                filterTheme={filterTheme}
                setFilterTheme={setFilterTheme}
                onAdd={addTl}
                onUpdate={updateTl}
                onDelete={delTl}
                viewMode={viewMode}
              />
            } />
            <Route path="/sessions" element={
              <Sessions
                sessions={sessions}
                onAdd={addSes}
                onUpdate={updateSes}
                onDelete={delSes}
                onAddTl={addTl}
              />
            } />
            <Route path="/projects" element={<Projects />} />
            <Route path="*" element={<Navigate to="/timeline" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
