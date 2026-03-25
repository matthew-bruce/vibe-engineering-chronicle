import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CardForm, { blankForm } from '../CardForm.jsx';

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

  it('has empty title, body, and benefit', () => {
    const f = blankForm();
    expect(f.title).toBe('');
    expect(f.body).toBe('');
    expect(f.benefit).toBe('');
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

  it('renders category select', () => {
    renderForm();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('category select does not include "session" option', () => {
    renderForm();
    const options = Array.from(screen.getByRole('combobox').options).map(o => o.value);
    expect(options).not.toContain('session');
  });

  it('category select includes expected categories', () => {
    renderForm();
    const options = Array.from(screen.getByRole('combobox').options).map(o => o.value);
    expect(options).toContain('wow');
    expect(options).toContain('learning');
    expect(options).toContain('tooling');
    expect(options).toContain('built');
    expect(options).toContain('aspiration');
    expect(options).toContain('ideas');
  });

  it('renders all 7 theme chips', () => {
    renderForm();
    expect(screen.getByText('Signal')).toBeInTheDocument();
    expect(screen.getByText('Industry')).toBeInTheDocument();
    expect(screen.getByText('Economics')).toBeInTheDocument();
    expect(screen.getByText('Org Design')).toBeInTheDocument();
    expect(screen.getByText('Evidence')).toBeInTheDocument();
    expect(screen.getByText('Leadership')).toBeInTheDocument();
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
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'learning' } });
    expect(onChange).toHaveBeenCalledWith('category', 'learning');
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
