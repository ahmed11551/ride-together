import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SearchForm from '../search/SearchForm';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SearchForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSearchForm = () => {
    return render(
      <BrowserRouter>
        <SearchForm />
      </BrowserRouter>
    );
  };

  it('should render search form', () => {
    renderSearchForm();
    
    expect(screen.getByLabelText(/город отправления/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/город прибытия/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /найти/i })).toBeInTheDocument();
  });

  it('should update input values', () => {
    renderSearchForm();
    
    const fromInput = screen.getByLabelText(/город отправления/i) as HTMLInputElement;
    const toInput = screen.getByLabelText(/город прибытия/i) as HTMLInputElement;

    fireEvent.change(fromInput, { target: { value: 'Москва' } });
    fireEvent.change(toInput, { target: { value: 'Санкт-Петербург' } });

    expect(fromInput.value).toBe('Москва');
    expect(toInput.value).toBe('Санкт-Петербург');
  });

  it('should navigate to search results on submit', async () => {
    renderSearchForm();
    
    const fromInput = screen.getByLabelText(/город отправления/i);
    const toInput = screen.getByLabelText(/город прибытия/i);
    const submitButton = screen.getByRole('button', { name: /найти/i });

    fireEvent.change(fromInput, { target: { value: 'Москва' } });
    fireEvent.change(toInput, { target: { value: 'Санкт-Петербург' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/search')
      );
    });
  });

  it('should not submit with empty fields', () => {
    renderSearchForm();
    
    const submitButton = screen.getByRole('button', { name: /найти/i });
    fireEvent.click(submitButton);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

