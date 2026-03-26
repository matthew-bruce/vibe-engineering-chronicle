import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuickCapture from '../QuickCapture.jsx';

function renderQC(onAdd = vi.fn()) {
  render(<QuickCapture onAdd={onAdd} />);
  return { onAdd };
}

describe('QuickCapture — initial state', () => {
  it('renders the placeholder input', () => {
    renderQC();
    expect(screen.getByPlaceholderText(/capture a thought/i)).toBeInTheDocument();
  });

  it('does not show Capture button before focus', () => {
    renderQC();
    expect(screen.queryByRole('button', { name: /capture/i })).toBeNull();
  });

  it('does not show source or date fields before focus', () => {
    renderQC();
    expect(screen.queryByPlaceholderText(/source/i)).toBeNull();
  });
});

describe('QuickCapture — expansion', () => {
  it('expands on focus showing Capture button and extra fields', () => {
    renderQC();
    fireEvent.focus(screen.getByPlaceholderText(/capture a thought/i));
    expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/source/i)).toBeInTheDocument();
  });

  it('shows a date input after expansion', () => {
    renderQC();
    fireEvent.focus(screen.getByPlaceholderText(/capture a thought/i));
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).not.toBeNull();
  });

  it('collapses when Cancel is clicked', () => {
    renderQC();
    fireEvent.focus(screen.getByPlaceholderText(/capture a thought/i));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('button', { name: /capture/i })).toBeNull();
    expect(screen.queryByPlaceholderText(/source/i)).toBeNull();
  });
});

describe('QuickCapture — submission', () => {
  it('calls onAdd with category capture when Capture button clicked', () => {
    const onAdd = vi.fn();
    renderQC(onAdd);
    const input = screen.getByPlaceholderText(/capture a thought/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'An interesting insight' } });
    fireEvent.click(screen.getByRole('button', { name: /capture/i }));
    expect(onAdd).toHaveBeenCalledOnce();
    const arg = onAdd.mock.calls[0][0];
    expect(arg.title).toBe('An interesting insight');
    expect(arg.category).toBe('capture');
  });

  it('calls onAdd when Enter is pressed', () => {
    const onAdd = vi.fn();
    renderQC(onAdd);
    const input = screen.getByPlaceholderText(/capture a thought/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Press enter test' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd.mock.calls[0][0].title).toBe('Press enter test');
  });

  it('does not call onAdd when input is empty', () => {
    const onAdd = vi.fn();
    renderQC(onAdd);
    const input = screen.getByPlaceholderText(/capture a thought/i);
    fireEvent.focus(input);
    fireEvent.click(screen.getByRole('button', { name: /capture/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('collapses after save', () => {
    const onAdd = vi.fn();
    renderQC(onAdd);
    const input = screen.getByPlaceholderText(/capture a thought/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: /capture/i }));
    expect(screen.queryByPlaceholderText(/source/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /capture/i })).toBeNull();
  });

  it('clears text after save', () => {
    const onAdd = vi.fn();
    renderQC(onAdd);
    const input = screen.getByPlaceholderText(/capture a thought/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: /capture/i }));
    expect(screen.getByPlaceholderText(/capture a thought/i)).toHaveValue('');
  });

  it('includes source in body when provided', () => {
    const onAdd = vi.fn();
    renderQC(onAdd);
    const input = screen.getByPlaceholderText(/capture a thought/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Some quote' } });
    fireEvent.change(screen.getByPlaceholderText(/source/i), { target: { value: 'Some Author' } });
    fireEvent.click(screen.getByRole('button', { name: /capture/i }));
    const arg = onAdd.mock.calls[0][0];
    expect(arg.body).toContain('Some Author');
  });

  it('sets empty body when no source given', () => {
    const onAdd = vi.fn();
    renderQC(onAdd);
    const input = screen.getByPlaceholderText(/capture a thought/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Just a thought' } });
    fireEvent.click(screen.getByRole('button', { name: /capture/i }));
    expect(onAdd.mock.calls[0][0].body).toBe('');
  });

  it('collapses on Escape key', () => {
    renderQC();
    const input = screen.getByPlaceholderText(/capture a thought/i);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByPlaceholderText(/source/i)).toBeNull();
  });
});
