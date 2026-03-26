import { useState, useEffect, useRef } from 'react';
import { getProjects, uploadProjectScreenshot, deleteAttachment, softDeleteProject, updateProjectStatus } from '../../lib/db.js';
import { minsToHours } from '../constants.js';

const STATUS_CONFIG = {
  live:        { label: 'Live',        color: '#52C788' },
  in_progress: { label: 'In Progress', color: '#4A9EDB' },
  poc:         { label: 'PoC',         color: '#F5A623' },
  archived:    { label: 'Archived',    color: '#9ca3af' },
};

export default function Projects() {
  const [projects, setProjects]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [selectedId, setSelectedId]           = useState(null);
  const [carouselIdx, setCarouselIdx]         = useState(0);
  const [uploading, setUploading]             = useState(false);
  const [uploadError, setUploadError]         = useState(null);
  const [dragOver, setDragOver]               = useState(false);
  const [confirmDelAtt, setConfirmDelAtt]     = useState(null);
  const [confirmDelProj, setConfirmDelProj]   = useState(null);
  const fileInputRef = useRef(null);

  async function load() {
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err.message ?? 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const project = projects.find(p => p.id === selectedId);
  const attachments = project?.attachments ?? [];

  function openDetail(id) {
    setSelectedId(id);
    setCarouselIdx(0);
    setUploadError(null);
    setConfirmDelAtt(null);
  }

  function goBack() {
    setSelectedId(null);
    setCarouselIdx(0);
  }

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5 MB.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const att = await uploadProjectScreenshot(selectedId, file);
      setProjects(prev => prev.map(p =>
        p.id === selectedId ? { ...p, attachments: [...p.attachments, att] } : p
      ));
      setCarouselIdx(attachments.length); // jump to newly added image
    } catch (err) {
      setUploadError(err.message ?? 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAttachment(id, storagePath) {
    try {
      await deleteAttachment(id, storagePath);
      const newAttachments = attachments.filter(a => a.id !== id);
      setProjects(prev => prev.map(p =>
        p.id === selectedId ? { ...p, attachments: newAttachments } : p
      ));
      setCarouselIdx(i => Math.min(i, Math.max(0, newAttachments.length - 1)));
      setConfirmDelAtt(null);
    } catch (err) {
      console.error('[Chronicle] deleteAttachment failed:', err);
    }
  }

  async function handleDeleteProject(id) {
    try {
      await softDeleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedId === id) setSelectedId(null);
      setConfirmDelProj(null);
    } catch (err) {
      console.error('[Chronicle] softDeleteProject failed:', err);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateProjectStatus(id, status);
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (err) {
      console.error('[Chronicle] updateProjectStatus failed:', err);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) return (
    <div className="empty">
      <div className="empty-title" style={{ fontStyle: 'normal', fontSize: 16, color: 'var(--muted)' }}>Loading projects…</div>
    </div>
  );

  if (error) return (
    <div className="empty">
      <div className="empty-title" style={{ color: 'var(--accent)' }}>⚠ {error}</div>
      <button className="btn btn-ghost btn-sm" onClick={load} style={{ marginTop: 12 }}>Retry</button>
    </div>
  );

  // ── DETAIL VIEW ───────────────────────────────────────────────────────────

  if (selectedId && project) {
    const st = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.poc;
    const costAvoided = Math.round(project.totalMins / 60) * 150;
    const currentAtt = attachments[carouselIdx];

    return (
      <div className="proj-detail">
        <div className="proj-back-row">
          <button className="btn btn-ghost btn-sm" onClick={goBack}>← Back</button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {confirmDelProj === selectedId ? (
              <>
                <button className="btn btn-ghost btn-sm" style={{ color: '#E86161', fontSize: 11 }} onClick={() => handleDeleteProject(selectedId)}>Delete project?</button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setConfirmDelProj(null)}>✕</button>
              </>
            ) : (
              <button className="btn btn-ghost btn-sm btn-icon" title="Delete project" onClick={() => setConfirmDelProj(selectedId)}>🗑</button>
            )}
          </div>
        </div>

        {/* Screenshot carousel */}
        <div className="proj-carousel">
          {attachments.length > 0 ? (
            <>
              <div className="proj-carousel-main">
                <img src={currentAtt.publicUrl} alt={currentAtt.caption || project.name} className="proj-carousel-img" />
                {attachments.length > 1 && (
                  <div className="proj-carousel-overlay">
                    <button className="proj-carousel-nav" onClick={() => setCarouselIdx(i => Math.max(0, i - 1))} disabled={carouselIdx === 0}>←</button>
                    <span className="proj-carousel-counter">{carouselIdx + 1} / {attachments.length}</span>
                    <button className="proj-carousel-nav" onClick={() => setCarouselIdx(i => Math.min(i + 1, attachments.length - 1))} disabled={carouselIdx === attachments.length - 1}>→</button>
                  </div>
                )}
                <div className="proj-carousel-del">
                  {confirmDelAtt === currentAtt.id ? (
                    <>
                      <button className="btn btn-ghost btn-sm" style={{ color: '#E86161', fontSize: 11, background: 'rgba(0,0,0,0.5)' }} onClick={() => handleDeleteAttachment(currentAtt.id, currentAtt.storagePath)}>Delete?</button>
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }} onClick={() => setConfirmDelAtt(null)}>✕</button>
                    </>
                  ) : (
                    <button className="btn btn-ghost btn-sm btn-icon" style={{ background: 'rgba(0,0,0,0.4)', color: '#fff' }} title="Delete screenshot" onClick={() => setConfirmDelAtt(currentAtt.id)}>🗑</button>
                  )}
                </div>
              </div>
              <div className="proj-carousel-footer">
                <label className="btn btn-ghost btn-sm" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
                  {uploading ? 'Uploading…' : '+ Add screenshot'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} disabled={uploading} />
                </label>
                {uploadError && <span style={{ fontSize: 12, color: '#E86161' }}>{uploadError}</span>}
              </div>
            </>
          ) : (
            <div
              className={`proj-upload-zone${dragOver ? ' drag-over' : ''}${uploading ? ' uploading' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div className="proj-upload-icon">{uploading ? '⏳' : '⊕'}</div>
              <div className="proj-upload-label">{uploading ? 'Uploading screenshot…' : 'Drop a screenshot or click to upload'}</div>
              {uploadError && <div style={{ fontSize: 12, color: '#E86161', marginTop: 6 }}>{uploadError}</div>}
            </div>
          )}
        </div>

        {/* Header */}
        <div className="proj-detail-hdr">
          <h2 className="proj-detail-name">{project.name}</h2>
          <select
            className="proj-status-select"
            value={project.status}
            onChange={e => handleStatusChange(project.id, e.target.value)}
            style={{ borderColor: st.color + '88', color: st.color, background: st.color + '18' }}
          >
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="proj-stats-row">
          <div className="proj-stat">
            <div className="proj-stat-value">{minsToHours(project.totalMins)}</div>
            <div className="proj-stat-label">Hours invested</div>
          </div>
          <div className="proj-stat">
            <div className="proj-stat-value">{project.saasReplaced || '—'}</div>
            <div className="proj-stat-label">SaaS replaced</div>
          </div>
          <div className="proj-stat">
            <div className="proj-stat-value">£{costAvoided.toLocaleString('en-GB')}</div>
            <div className="proj-stat-label">Procurement cost avoided <span style={{ opacity: 0.6, fontSize: 10 }}>(est. @ £150/hr)</span></div>
          </div>
        </div>

        {/* Content */}
        {project.problem && (
          <div className="proj-section">
            <div className="proj-section-label">The Problem</div>
            <div className="proj-section-text">{project.problem}</div>
          </div>
        )}

        {project.evolution && (
          <div className="proj-section">
            <div className="proj-section-label">What It Evolved Into</div>
            <div className="proj-section-text">{project.evolution}</div>
          </div>
        )}

        {(project.keyFeatures ?? []).length > 0 && (
          <div className="proj-section">
            <div className="proj-section-label">Key Features</div>
            <ul className="proj-features-list">
              {project.keyFeatures.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}

        {(project.liveUrl || project.demoUrl) && (
          <div className="proj-links">
            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">↗ Live app</a>}
            {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">▶ Demo</a>}
          </div>
        )}
      </div>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="tl-header">
        <div>
          <div className="section-eyebrow">Vibe Engineering Projects</div>
          <span className="tl-count">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
        </div>
      </div>
      <div className="proj-grid">
        {projects.map(p => {
          const st = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.poc;
          const thumb = p.attachments[0];
          const preview = p.problem
            ? p.problem.slice(0, 130) + (p.problem.length > 130 ? '…' : '')
            : '';
          return (
            <div key={p.id} className="proj-tile-wrap">
              <button className="proj-tile" onClick={() => openDetail(p.id)}>
                <div className="proj-tile-img-wrap">
                  {thumb
                    ? <img src={thumb.publicUrl} alt={p.name} className="proj-tile-img" />
                    : <div className="proj-tile-placeholder"><span>⊙</span></div>
                  }
                  <span className="proj-status proj-tile-status" style={{ background: st.color + '22', color: st.color, borderColor: st.color + '55' }}>{st.label}</span>
                </div>
                <div className="proj-tile-body">
                  <div className="proj-tile-name">{p.name}</div>
                  {preview && <div className="proj-tile-preview">{preview}</div>}
                  <div className="proj-tile-meta">
                    <span className="proj-tile-hrs">{minsToHours(p.totalMins)}</span>
                    {p.saasReplaced && <span className="proj-tile-saas">replaces {p.saasReplaced}</span>}
                  </div>
                </div>
              </button>
              <div className="proj-tile-del">
                {confirmDelProj === p.id ? (
                  <>
                    <button className="btn btn-ghost btn-sm" style={{ color: '#E86161', fontSize: 11 }} onClick={e => { e.stopPropagation(); handleDeleteProject(p.id); }}>Delete?</button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); setConfirmDelProj(null); }}>✕</button>
                  </>
                ) : (
                  <button className="btn btn-ghost btn-sm btn-icon" title="Delete project" onClick={e => { e.stopPropagation(); setConfirmDelProj(p.id); }}>🗑</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
