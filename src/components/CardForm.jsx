import { THEMES, CARD_FORMATS, toggleTheme, today } from '../constants.js';
import { cats } from '../../lib/cats.js';

export const blankForm = () => ({
  title: '',
  body: '',
  date: today(),
  category: 'wow',
  themes: [],
  benefit: '',
  impact: null,
  audience: null,
  format: null,
  sections: [],
});

const AUDIENCE_OPTIONS = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'practitioner', label: 'Practitioner' },
  { value: 'leadership',   label: 'Leadership' },
  { value: 'universal',    label: 'Universal' },
];

export default function CardForm({ form, onChange }) {
  const f = (k, v) => onChange(k, v);
  const catOptions = Object.entries(cats).filter(([k]) => k !== 'session' && k !== 'capture');
  const activeCat = cats[form.category] || cats.wow;

  return (
    <div className="form-grid">
      <div>
        <div className="form-label">Title *</div>
        <input
          className="form-input"
          placeholder="e.g. First tried Claude Code"
          value={form.title}
          onChange={e => f('title', e.target.value)}
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
      <div className="form-grid-full">
        <div className="form-label">Notes / Detail</div>
        <textarea
          className="form-textarea"
          placeholder="What happened? What did you learn? How did it feel?"
          value={form.body}
          onChange={e => f('body', e.target.value)}
        />
      </div>
      <div className="form-grid-full">
        <div className="form-label">Category</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: activeCat.color, flexShrink: 0, display: 'inline-block' }} />
          <select
            className="form-select"
            value={form.category}
            onChange={e => f('category', e.target.value)}
          >
            {catOptions.map(([k, v]) => (
              <option key={k} value={k} title={v.description || undefined}>{v.glyph} {v.label}</option>
            ))}
          </select>
        </div>
        {activeCat.description && (
          <div className="cat-description" style={{ marginTop: 4, fontSize: '0.78rem', opacity: 0.65, paddingLeft: 18 }}>
            {activeCat.description}
          </div>
        )}
      </div>
      <div>
        <div className="form-label">Impact</div>
        <div className="impact-selector">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              className={`impact-dot ${(form.impact ?? 0) >= n ? 'filled' : ''}`}
              onClick={() => f('impact', form.impact === n ? null : n)}
              title={`Impact ${n}`}
            />
          ))}
          {form.impact && <span className="impact-value">{form.impact}/5</span>}
        </div>
      </div>
      <div>
        <div className="form-label">Audience</div>
        <select
          className="form-select"
          value={form.audience ?? ''}
          onChange={e => f('audience', e.target.value || null)}
        >
          <option value="">— none —</option>
          {AUDIENCE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <div className="form-label">Format <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></div>
        <select
          className="form-select"
          value={form.format ?? ''}
          onChange={e => f('format', e.target.value || null)}
        >
          <option value="">— none —</option>
          {CARD_FORMATS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="form-grid-full">
        <div className="form-label">Themes</div>
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
      <div className="form-grid-full">
        <div className="form-label">
          Quick benefit note <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span>
        </div>
        <input
          className="form-input"
          placeholder="e.g. Saves 6 weeks of procurement time per tool"
          value={form.benefit}
          onChange={e => f('benefit', e.target.value)}
        />
      </div>
      <div className="form-grid-full">
        <div className="linked-benefits-placeholder">
          <span className="linked-benefits-label">Linked Benefits</span>
          Formal benefits tracking coming soon — use the quick note above for now.
        </div>
      </div>
      <div className="form-grid-full">
        <div className="form-label">
          Sections <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional detail blocks)</span>
        </div>
        {(form.sections || []).map((s, i) => (
          <div key={i} className="section-form-item">
            <input
              className="form-input"
              placeholder="Section label (e.g. What changed)"
              value={s.label}
              onChange={e => {
                const sections = [...form.sections];
                sections[i] = { ...sections[i], label: e.target.value };
                f('sections', sections);
              }}
            />
            <textarea
              className="form-textarea"
              placeholder="Section body…"
              value={s.body}
              onChange={e => {
                const sections = [...form.sections];
                sections[i] = { ...sections[i], body: e.target.value };
                f('sections', sections);
              }}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: 'flex-start', marginTop: 2 }}
              onClick={() => f('sections', form.sections.filter((_, j) => j !== i))}
            >Remove</button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 6, alignSelf: 'flex-start' }}
          onClick={() => f('sections', [...(form.sections || []), { label: '', body: '', order: (form.sections || []).length }])}
        >+ Add section</button>
      </div>
    </div>
  );
}
