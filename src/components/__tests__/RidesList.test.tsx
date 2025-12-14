import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import RidesList from '../rides/RidesList';

// Mock useRecentRidesPaginated
vi.mock('@/hooks/useRidesPaginated', () => ({
  useRecentRidesPaginated: () => ({
    data: {
      data: [
        {
          id: 'ride-1',
          from_city: 'Москва',
          from_address: 'Москва, м. Бауманская',
          to_city: 'Санкт-Петербург',
          to_address: 'Санкт-Петербург, м. Московская',
          departure_date: '2025-02-01',
          departure_time: '10:00:00',
          estimated_duration: '7 ч',
          price: 1500,
          seats_available: 2,
          allow_smoking: false,
          allow_pets: false,
          allow_music: true,
          driver: {
            full_name: 'Иван Иванов',
            avatar_url: null,
            rating: 4.5,
            trips_count: 10,
            is_verified: true,
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

    expect(screen.getByText(/Ближайшие поездки/i)).toBeInTheDocument();
    expect(screen.getByText('Москва')).toBeInTheDocument();
    expect(screen.getByText('Санкт-Петербург')).toBeInTheDocument();
  });

  it('should display ride information', () => {
    renderRidesList();

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    // Price may be formatted as "1,500" or "1500" depending on locale
    expect(screen.getByText(/1[, ]?500/i)).toBeInTheDocument();
  });
});

