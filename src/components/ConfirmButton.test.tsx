import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmButton from './ConfirmButton';

describe('ConfirmButton', () => {
  it('calls onConfirm when clicked', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    render(<ConfirmButton onConfirm={handleConfirm} disabled={false} />);

    const button = screen.getByRole('button', { name: /confirm/i });
    await user.click(button);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const handleConfirm = vi.fn();
    render(<ConfirmButton onConfirm={handleConfirm} disabled={true} />);

    const button = screen.getByRole('button', { name: /confirm/i });
    expect(button).toBeDisabled();
  });

  it('is enabled when disabled prop is false', () => {
    const handleConfirm = vi.fn();
    render(<ConfirmButton onConfirm={handleConfirm} disabled={false} />);

    const button = screen.getByRole('button', { name: /confirm/i });
    expect(button).not.toBeDisabled();
  });
});
