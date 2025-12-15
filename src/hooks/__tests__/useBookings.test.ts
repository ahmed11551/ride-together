import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCreateBooking, useUpdateBookingStatus } from '../useBookings';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock notifications
vi.mock('@/lib/notifications', () => ({
  notifyNewBooking: vi.fn(),
  notifyBookingConfirmed: vi.fn(),
}));

describe('useBookings', () => {
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

  describe('useCreateBooking', () => {
    it('should create booking successfully', async () => {
      const mockBooking = {
        id: 'booking-id',
        ride_id: 'ride-id',
        passenger_id: 'user-id',
        seats_booked: 2,
        total_price: 3000,
        status: 'pending',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as never);

      const { result } = renderHook(() => useCreateBooking(), { wrapper });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      const mutationResult = await result.current.mutateAsync({
        rideId: 'ride-id',
        seats: 2,
        totalPrice: 3000,
      });

      expect(mutationResult).toEqual(mockBooking);
      expect(supabase.from).toHaveBeenCalledWith('bookings');
    });

    it('should handle booking creation error', async () => {
      const mockError = { message: 'Booking failed', code: '23505' };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as never);

      const { result } = renderHook(() => useCreateBooking(), { wrapper });

      await expect(
        result.current.mutateAsync({
          rideId: 'ride-id',
          seats: 2,
          totalPrice: 3000,
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('useUpdateBookingStatus', () => {
    it('should update booking status successfully', async () => {
      const mockCurrentBooking = {
        id: 'booking-id',
        ride_id: 'ride-id',
        seats_booked: 2,
        status: 'pending' as const,
      };

      const mockUpdatedBooking = {
        id: 'booking-id',
        ride_id: 'ride-id',
        passenger_id: 'user-id',
        status: 'confirmed' as const,
      };

      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockCurrentBooking, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUpdatedBooking, error: null }),
              }),
            }),
          }),
        });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as never);

      const { result } = renderHook(() => useUpdateBookingStatus(), { wrapper });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      const mutationResult = await result.current.mutateAsync({
        id: 'booking-id',
        status: 'confirmed',
      });

      expect(mutationResult).toEqual(mockUpdatedBooking);
      expect(supabase.from).toHaveBeenCalledWith('bookings');
    });
  });
});

