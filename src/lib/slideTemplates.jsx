import { cats } from '../../lib/cats.js';
import { THEMES, fmtDate } from '../constants.js';

// ── Shared helpers ────────────────────────────────────────────────────────────

export function thumbScrollDelta(stripRect, thumbRect) {
  if (thumbRect.left < stripRect.left) return -(stripRect.left - thumbRect.left + 12);
  if (thumbRect.right > stripRect.right) return thumbRect.right - stripRect.right + 12;
  return 0;
}

function sourceDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function MetaRow({ card }) {
  const cat = cats[card.category] || cats.wow;
  const themes = (card.themes || []).map(id => THEMES.find(t => t.id === id)).filter(Boolean);
  return (
    <div className="pm-meta-row">
      <div className="pm-meta-left">
        <span className="pm-cat-pill" style={{ background: cat.color + '22', color: cat.color }}>
          {cat.glyph} {cat.label}
        </span>
        {themes.map(t => (
          <span key={t.id} className="pm-theme-pill">{t.label}</span>
        ))}
      </div>
      <span className="pm-slide-date">{fmtDate(card.date)}</span>
    </div>
  );
}

function SectionCallout({ section }) {
  return (
    <div className="pm-section-callout">
      <div className="pm-section-label">{section.label}</div>
      {section.body && <div className="pm-section-body">{section.body}</div>}
    </div>
  );
}

function BenefitCallout({ benefit }) {
  if (!benefit) return null;
  return (
    <div className="pm-benefit">
      <div className="pm-benefit-label">Benefit</div>
      <div className="pm-benefit-body">{benefit}</div>
    </div>
  );
}

function SourceBtn({ source }) {
  if (!source) return null;
  const isUrl = /^https?:\/\//i.test(source);
  if (isUrl) {
    return (
      <a href={source} target="_blank" rel="noopener noreferrer" className="pm-source-btn">
        ↗ {sourceDomain(source)}
      </a>
    );
  }
  return <span className="pm-source-text">⌁ {source}</span>;
}

// ── Template renderers ────────────────────────────────────────────────────────

function renderStandard(card) {
  return (
    <div className="pm-slide">
      <MetaRow card={card} />
      <div className="pm-title pm-title-std">{card.title}</div>
      {card.body && <div className="pm-body">{card.body}</div>}
      <SourceBtn source={card.source} />
    </div>
  );
}

function renderDetailedSingle(card) {
  const sections = card.sections || [];
  return (
    <div className="pm-slide">
      <MetaRow card={card} />
      <div className="pm-title pm-title-det1">{card.title}</div>
      {card.body && <div className="pm-body">{card.body}</div>}
      {sections.length > 0 && (
        <div className="pm-sections-stack">
          {sections.map(s => <SectionCallout key={s.id} section={s} />)}
        </div>
      )}
      <BenefitCallout benefit={card.benefit} />
      <SourceBtn source={card.source} />
    </div>
  );
}

function renderDetailedTwoCol(card) {
  const sections = card.sections || [];
  return (
    <div className="pm-slide">
      <MetaRow card={card} />
      <div className="pm-title pm-title-det2">{card.title}</div>
      {card.body && <div className="pm-body">{card.body}</div>}
      {sections.length > 0 && (
        <div className="pm-sections-2col">
          {sections.slice(0, 2).map(s => <SectionCallout key={s.id} section={s} />)}
        </div>
      )}
      <BenefitCallout benefit={card.benefit} />
      <SourceBtn source={card.source} />
    </div>
  );
}

function renderDetailedThreeCol(card) {
  const sections = card.sections || [];
  return (
    <div className="pm-slide">
      <MetaRow card={card} />
      <div className="pm-title pm-title-det3">{card.title}</div>
      {card.body && <div className="pm-body">{card.body}</div>}
      {sections.length > 0 && (
        <div className="pm-sections-3col">
          {sections.slice(0, 3).map(s => <SectionCallout key={s.id} section={s} />)}
        </div>
      )}
      <BenefitCallout benefit={card.benefit} />
      <SourceBtn source={card.source} />
    </div>
  );
}

function renderDetailedOverflow(card) {
  const sections = card.sections || [];
  return (
    <div className="pm-slide">
      <MetaRow card={card} />
      <div className="pm-title pm-title-detov">{card.title}</div>
      {card.body && <div className="pm-body">{card.body}</div>}
      {sections.length > 0 && (
        <div className="pm-sections-stack">
          {sections.map(s => <SectionCallout key={s.id} section={s} />)}
        </div>
      )}
      <BenefitCallout benefit={card.benefit} />
      <SourceBtn source={card.source} />
    </div>
  );
}

// ── Registry ──────────────────────────────────────────────────────────────────
// Add new templates here and in the DB slide_templates table — no other changes needed.

export const TEMPLATE_REGISTRY = {
  'standard':           renderStandard,
  'detailed-single':    renderDetailedSingle,
  'detailed-two-col':   renderDetailedTwoCol,
  'detailed-three-col': renderDetailedThreeCol,
  'detailed-overflow':  renderDetailedOverflow,
};

// ── Scorer ────────────────────────────────────────────────────────────────────

export function scoreCard(card, detailMode) {
  if (!detailMode) return 'standard';
  if (card.card_template_preference) return card.card_template_preference;
  const n = (card.sections || []).length;
  if (n <= 1) return 'detailed-single';
  if (n === 2) return 'detailed-two-col';
  if (n === 3) return 'detailed-three-col';
  return 'detailed-overflow';
}
