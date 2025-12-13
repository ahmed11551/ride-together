import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import RidesList from '../rides/RidesList';

// Mock useRecentRidesPaginated
vi.mock('@/hooks/useRides', () => ({
  useRecentRidesPaginated: () => ({
    data: {
      rides: [
        {
          id: 'ride-1',
          from_city: 'Москва',
          to_city: 'Санкт-Петербург',
          departure_date: '2025-02-01',
          departure_time: '10:00',
          price: 1500,
          seats_available: 2,
          driver: {
            full_name: 'Иван Иванов',
            rating: 4.5,
          },
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    },
    isLoading: false,
    error: null,
  }),
}));

describe('RidesList', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderRidesList = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <RidesList />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render rides list', () => {
    renderRidesList();

    expect(screen.getByText(/ближайшие поездки/i)).toBeInTheDocument();
    expect(screen.getByText('Москва')).toBeInTheDocument();
    expect(screen.getByText('Санкт-Петербург')).toBeInTheDocument();
  });

  it('should display ride information', () => {
    renderRidesList();

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText(/1500/i)).toBeInTheDocument();
  });
});

