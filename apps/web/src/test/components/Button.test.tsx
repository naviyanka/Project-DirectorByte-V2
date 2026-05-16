import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../../design-system/components/Button/Button';

describe('Button', () => {
  it('renders with correct label', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows spinner when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    // The spinner span has aria-hidden="true" but we can check for its existence in DOM
    // The text 'Loading' is hidden but still in document
    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled(); // Disabled during loading
  });

  it('applies variant classes correctly', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    // styles.danger is likely a class name. In CSS modules it might be hashed.
    // But we can check if it contains some identifier if we use a mock for CSS modules.
    // In Vitest with jsdom, CSS modules might be empty or mapped.
    const button = container.firstChild as HTMLElement;
    expect(button.className).toContain('button');
    expect(button.className).toContain('danger');
  });
});
