import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render error fallback when there is an error', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // ErrorBoundary should show error UI - check for button or alert
    // The error message might be in AlertTitle which is not easily queryable
    // So we check for the presence of error UI elements
    const tryAgainButton = screen.getByRole('button', { name: /Попробовать снова/i });
    expect(tryAgainButton).toBeInTheDocument();
    
    // Verify error content is present in the container
    expect(container.textContent).toMatch(/Что-то пошло не так|Произошла непредвиденная ошибка/i);
  });

  it('should show refresh button on error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // ErrorBoundary shows "Попробовать снова" button, not "обновить"
    const refreshButton = screen.getByRole('button', { name: /Попробовать снова/i });
    expect(refreshButton).toBeInTheDocument();
  });
});

