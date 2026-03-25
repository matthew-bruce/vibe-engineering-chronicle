import { CATS, THEMES, toggleTheme, today } from '../constants.js';

export const blankForm = () => ({
  title: '',
  body: '',
  date: today(),
  category: 'wow',
  themes: [],
  benefit: '',
});

export default function CardForm({ form, onChange }) {
  const f = (k, v) => onChange(k, v);
  const catOptions = Object.entries(CATS).filter(([k]) => k !== 'session');
  const activeCat = CATS[form.category] || CATS.wow;

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
              <option key={k} value={k}>{v.glyph} {v.label}</option>
            ))}
          </select>
        </div>
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
          Benefit / so what? <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span>
        </div>
        <input
          className="form-input"
          placeholder="e.g. Saves 6 weeks of procurement time per tool"
          value={form.benefit}
          onChange={e => f('benefit', e.target.value)}
        />
      </div>
    </div>
  );
}
