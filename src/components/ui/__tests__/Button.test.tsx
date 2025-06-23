import { render, screen } from '@testing-library/react';
import Button from '../Button'; // Adjust path as necessary
import { describe, it, expect } from 'vitest';

describe('Button component', () => {
  it('renders button with children', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
  });

  it('applies the correct variant class for primary', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /primary button/i });
    expect(buttonElement.className).toContain('bg-primary');
    expect(buttonElement.className).toContain('text-white');
  });
}); 