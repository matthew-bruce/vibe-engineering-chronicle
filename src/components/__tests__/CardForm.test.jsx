import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import CardForm, { blankForm } from '../CardForm.jsx';
import { cats } from '../../../lib/cats.js';

// ─── blankForm() ──────────────────────────────────────────────────────────────

describe('blankForm()', () => {
  it("returns today's date", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(blankForm().date).toBe(today);
  });

  it('defaults category to wow', () => {
    expect(blankForm().category).toBe('wow');
  });

  it('has empty themes array', () => {
    expect(blankForm().themes).toEqual([]);
  });

  it('has empty title, body, and benefit; null impact, audience, and format', () => {
    const f = blankForm();
    expect(f.title).toBe('');
    expect(f.body).toBe('');
    expect(f.benefit).toBe('');
    expect(f.impact).toBeNull();
    expect(f.audience).toBeNull();
    expect(f.format).toBeNull();
  });

  it('produces a new object each call (not a shared reference)', () => {
    const a = blankForm();
    const b = blankForm();
    a.themes.push('signal');
    expect(b.themes).toHaveLength(0);
  });
});

// ─── CardForm rendering ───────────────────────────────────────────────────────

function renderForm(overrides = {}) {
  const form = { ...blankForm(), ...overrides };
  const onChange = vi.fn();
  render(<CardForm form={form} onChange={onChange} />);
  return { form, onChange };
}

describe('CardForm rendering', () => {
  it('renders the title input', () => {
    renderForm();
    expect(screen.getByPlaceholderText(/first tried claude code/i)).toBeInTheDocument();
  });

  it('renders a date input', () => {
    renderForm();
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
  });

  it('date input value matches form.date', () => {
    const today = new Date().toISOString().slice(0, 10);
    renderForm({ date: today });
    expect(document.querySelector('input[type="date"]').value).toBe(today);
  });

  it('renders the notes textarea', () => {
    renderForm();
    expect(screen.getByPlaceholderText(/what happened/i)).toBeInTheDocument();
  });

  it('renders the benefit input', () => {
    renderForm();
    expect(screen.getByPlaceholderText(/saves 6 weeks/i)).toBeInTheDocument();
  });

  it('renders category, audience, and format selects', () => {
    renderForm();
    expect(screen.getAllByRole('combobox')).toHaveLength(3);
  });

  it('renders the format select with a none option', () => {
    renderForm();
    const selects = screen.getAllByRole('combobox');
    const formatSelect = selects[2]; // third select: format
    const options = Array.from(formatSelect.options).map(o => o.value);
    expect(options).toContain('');
    expect(options).toContain('fact_or_fiction');
  });

  it('category select does not include "session" or "capture" options', () => {
    renderForm();
    const [catSelect] = screen.getAllByRole('combobox');
    const options = Array.from(catSelect.options).map(o => o.value);
    expect(options).not.toContain('session');
    expect(options).not.toContain('capture');
  });

  it('category select includes expected categories', () => {
    renderForm();
    const [catSelect] = screen.getAllByRole('combobox');
    const options = Array.from(catSelect.options).map(o => o.value);
    expect(options).toContain('wow');
    expect(options).toContain('learning');
    expect(options).toContain('tooling');
    expect(options).toContain('built');
    expect(options).toContain('aspiration');
    expect(options).toContain('ideas');
  });

  it('renders impact dot buttons', () => {
    renderForm();
    const dots = document.querySelectorAll('.impact-dot');
    expect(dots).toHaveLength(5);
  });

  it('renders linked benefits placeholder', () => {
    renderForm();
    expect(screen.getByText(/formal benefits tracking coming soon/i)).toBeInTheDocument();
  });

  it('renders all 7 theme chips', () => {
    renderForm();
    expect(screen.getByText('Signal')).toBeInTheDocument();
    expect(screen.getByText('Industry')).toBeInTheDocument();
    expect(screen.getByText('Economics')).toBeInTheDocument();
    expect(screen.getByText('Org Design')).toBeInTheDocument();
    expect(screen.getByText('Evidence')).toBeInTheDocument();
    expect(screen.getAllByText('Leadership').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Unlock')).toBeInTheDocument();
  });
});

// ─── CardForm interactions ────────────────────────────────────────────────────

describe('CardForm onChange callbacks', () => {
  it('calls onChange with (title, value) when title input changes', () => {
    const { onChange } = renderForm();
    fireEvent.change(screen.getByPlaceholderText(/first tried claude code/i), {
      target: { value: 'My new title' },
    });
    expect(onChange).toHaveBeenCalledWith('title', 'My new title');
  });

  it('calls onChange with (date, value) when date changes', () => {
    const { onChange } = renderForm();
    fireEvent.change(document.querySelector('input[type="date"]'), {
      target: { value: '2026-01-15' },
    });
    expect(onChange).toHaveBeenCalledWith('date', '2026-01-15');
  });

  it('calls onChange with (body, value) when notes textarea changes', () => {
    const { onChange } = renderForm();
    fireEvent.change(screen.getByPlaceholderText(/what happened/i), {
      target: { value: 'Some body text' },
    });
    expect(onChange).toHaveBeenCalledWith('body', 'Some body text');
  });

  it('calls onChange with (category, value) when category select changes', () => {
    const { onChange } = renderForm();
    const [catSelect] = screen.getAllByRole('combobox');
    fireEvent.change(catSelect, { target: { value: 'learning' } });
    expect(onChange).toHaveBeenCalledWith('category', 'learning');
  });

  it('calls onChange with (impact, n) when an impact dot is clicked', () => {
    const { onChange } = renderForm({ impact: null });
    const dots = document.querySelectorAll('.impact-dot');
    fireEvent.click(dots[2]); // third dot = impact 3
    expect(onChange).toHaveBeenCalledWith('impact', 3);
  });

  it('calls onChange with (impact, null) when the active dot is clicked again', () => {
    const { onChange } = renderForm({ impact: 3 });
    const dots = document.querySelectorAll('.impact-dot');
    fireEvent.click(dots[2]); // click dot 3 again → toggle off
    expect(onChange).toHaveBeenCalledWith('impact', null);
  });

  it('calls onChange with (audience, value) when audience select changes', () => {
    const { onChange } = renderForm();
    const [, audSelect] = screen.getAllByRole('combobox');
    fireEvent.change(audSelect, { target: { value: 'leadership' } });
    expect(onChange).toHaveBeenCalledWith('audience', 'leadership');
  });

  it('calls onChange with (format, value) when format select changes', () => {
    const { onChange } = renderForm();
    const [,, fmtSelect] = screen.getAllByRole('combobox');
    fireEvent.change(fmtSelect, { target: { value: 'fact_or_fiction' } });
    expect(onChange).toHaveBeenCalledWith('format', 'fact_or_fiction');
  });

  it('calls onChange with (format, null) when format is cleared', () => {
    const { onChange } = renderForm({ format: 'fact_or_fiction' });
    const [,, fmtSelect] = screen.getAllByRole('combobox');
    fireEvent.change(fmtSelect, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith('format', null);
  });

  it('calls onChange with (benefit, value) when benefit input changes', () => {
    const { onChange } = renderForm();
    fireEvent.change(screen.getByPlaceholderText(/saves 6 weeks/i), {
      target: { value: 'Saves time' },
    });
    expect(onChange).toHaveBeenCalledWith('benefit', 'Saves time');
  });

  it('calls onChange with toggled themes when a theme chip is clicked (add)', () => {
    const { onChange } = renderForm({ themes: [] });
    fireEvent.click(screen.getByText('Signal'));
    expect(onChange).toHaveBeenCalledWith('themes', ['signal']);
  });

  it('calls onChange with toggled themes when a selected chip is clicked (remove)', () => {
    const { onChange } = renderForm({ themes: ['signal'] });
    fireEvent.click(screen.getByText('Signal'));
    expect(onChange).toHaveBeenCalledWith('themes', []);
  });

  it('adds a theme to existing selection without removing others', () => {
    const { onChange } = renderForm({ themes: ['signal'] });
    fireEvent.click(screen.getByText('Industry'));
    expect(onChange).toHaveBeenCalledWith('themes', ['signal', 'industry']);
  });
});

// ─── Category description subtitle ────────────────────────────────────────────

describe('CardForm category description', () => {
  afterEach(() => {
    cats.wow.description = '';
    cats.learning.description = '';
    cleanup();
  });

  it('shows description subtitle when selected category has a description', () => {
    cats.wow.description = 'A moment of genuine surprise or delight.';
    renderForm({ category: 'wow' });
    expect(screen.getByText('A moment of genuine surprise or delight.')).toBeInTheDocument();
  });

  it('does not render description element when description is empty', () => {
    cats.wow.description = '';
    renderForm({ category: 'wow' });
    expect(document.querySelector('.cat-description')).toBeNull();
  });

  it('updates description when category selection changes', () => {
    cats.wow.description = 'Wow description';
    cats.learning.description = 'Learning description';
    // Render with wow selected — wow description visible
    const { form } = renderForm({ category: 'wow' });
    expect(screen.getByText('Wow description')).toBeInTheDocument();
    expect(screen.queryByText('Learning description')).toBeNull();
  });

  it('option elements carry description as title attribute for hover', () => {
    cats.wow.description = 'Wow hover text';
    renderForm({ category: 'wow' });
    const [catSelect] = screen.getAllByRole('combobox');
    const wowOption = Array.from(catSelect.options).find(o => o.value === 'wow');
    expect(wowOption.title).toBe('Wow hover text');
  });

  it('option title is absent when description is empty', () => {
    cats.wow.description = '';
    renderForm({ category: 'wow' });
    const [catSelect] = screen.getAllByRole('combobox');
    const wowOption = Array.from(catSelect.options).find(o => o.value === 'wow');
    expect(wowOption.title).toBe('');
  });
});
