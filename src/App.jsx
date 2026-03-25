import { useState, useEffect, useCallback } from 'react';
import {
  initLookups,
  loadTimeline, loadCaptures, loadSessions,
  addTimelineEntry, updateTimelineEntry, softDeleteCard, addCapture,
  addSession, updateSession, softDeleteSession,
} from '../lib/db.js';
import { CATS, THEMES, today } from './constants.js';
import CSS from './styles.js';
import PresentMode from './components/PresentMode.jsx';
import Timeline from './components/Timeline.jsx';
import Capture from './components/Capture.jsx';
import Sessions from './components/Sessions.jsx';

export default function App() {
  const [tab, setTab] = useState('timeline');
  const [tl, setTl] = useState([]);
  const [cap, setCap] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [presenting, setPresenting] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [showPfPanel, setShowPfPanel] = useState(false);
  const [pfCats, setPfCats] = useState(() => Object.keys(CATS));
  const [pfThemes, setPfThemes] = useState(() => THEMES.map(t => t.id));
  const [pfSignalOnly, setPfSignalOnly] = useState(false);

  useEffect(() => {
    async function boot() {
      try {
        await initLookups();
        const [tlData, capData, sesData] = await Promise.all([
          loadTimeline(),
          loadCaptures(),
          loadSessions(),
        ]);
        setTl(tlData);
        setCap(capData);
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

  const addCap = useCallback(async entry => {
    try {
      const saved = await addCapture(entry);
      setCap(p => [saved, ...p]);
    } catch (err) { console.error('[Chronicle] addCap failed:', err); }
  }, []);

  const delCap = useCallback(async id => {
    try {
      await softDeleteCard(id);
      setCap(p => p.filter(e => e.id !== id));
    } catch (err) { console.error('[Chronicle] delCap failed:', err); }
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

  const promote = useCallback(async (capture) => {
    const entry = {
      title:    capture.text.length > 80 ? capture.text.slice(0, 78) + '…' : capture.text,
      body:     capture.source ? `${capture.text}\n\n— ${capture.source}` : capture.text,
      date:     today(),
      category: 'learning',
      themes:   capture.themes ?? [],
      benefit:  '',
    };
    try {
      const [saved] = await Promise.all([
        addTimelineEntry(entry),
        softDeleteCard(capture.id),
      ]);
      setTl(p => [...p, saved]);
      setCap(p => p.filter(e => e.id !== capture.id));
      setTab('timeline');
    } catch (err) { console.error('[Chronicle] promote failed:', err); }
  }, []);

  const sorted = [...tl]
    .filter(e => filterCat === 'all' || e.category === filterCat)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const allSorted = [...tl].sort((a, b) => new Date(a.date) - new Date(b.date));
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
              <div className="hdr-title">Vibe Coded</div>
              <div className="hdr-sub">A personal chronicle · {tl.length} entries</div>
            </div>
          </div>
          <div className="hdr-right">
            {tl.length > 0 && (
              <div className="pf-anchor">
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
                        {Object.entries(CATS).map(([k, v]) => (
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
            <div className="tabs">
              <button className={`tab ${tab === 'timeline' ? 'on' : ''}`} onClick={() => setTab('timeline')}>Timeline</button>
              <button className={`tab ${tab === 'sessions' ? 'on' : ''}`} onClick={() => setTab('sessions')}>Sessions</button>
              <button className={`tab ${tab === 'capture' ? 'on' : ''}`} onClick={() => setTab('capture')}>
                Capture {cap.length > 0 && <span className="badge">{cap.length}</span>}
              </button>
            </div>
          </div>
        </header>
        <main className="main">
          {tab === 'timeline' ? (
            <Timeline
              entries={sorted}
              allCount={tl.length}
              filterCat={filterCat}
              setFilterCat={setFilterCat}
              onAdd={addTl}
              onUpdate={updateTl}
              onDelete={delTl}
            />
          ) : tab === 'sessions' ? (
            <Sessions
              sessions={sessions}
              onAdd={addSes}
              onUpdate={updateSes}
              onDelete={delSes}
              onAddTl={addTl}
            />
          ) : (
            <Capture
              entries={cap}
              onAdd={addCap}
              onDelete={delCap}
              onPromote={promote}
            />
          )}
        </main>
      </div>
    </>
  );
}
