import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRides, useRide } from '../useRides';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useRides', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('useRides', () => {
    it('should fetch rides successfully', async () => {
      const mockRides = [
        {
          id: 'ride-1',
          driver_id: 'driver-1',
          from_city: 'Москва',
          to_city: 'Санкт-Петербург',
          departure_date: '2025-02-01',
          departure_time: '10:00',
          price: 1500,
          seats_available: 2,
          driver: {
            full_name: 'Test Driver',
            rating: 4.5,
          },
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockRides, error: null }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockFrom());

      const { result } = renderHook(() => useRides(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRides);
    });
  });

  describe('useRide', () => {
    it('should fetch single ride successfully', async () => {
      const mockRide = {
        id: 'ride-1',
        driver_id: 'driver-1',
        from_city: 'Москва',
        to_city: 'Санкт-Петербург',
        driver: {
          full_name: 'Test Driver',
          rating: 4.5,
        },
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockRide, error: null }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockFrom());

      const { result } = renderHook(() => useRide('ride-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRide);
    });
  });
});

