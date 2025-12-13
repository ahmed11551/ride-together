import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateBooking, useConfirmBooking } from '../useBookings';
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

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockFrom());

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

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockFrom());

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

  describe('useConfirmBooking', () => {
    it('should confirm booking successfully', async () => {
      const mockBooking = {
        id: 'booking-id',
        ride_id: 'ride-id',
        passenger_id: 'user-id',
        status: 'confirmed',
      };

      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockFrom());

      const { result } = renderHook(() => useConfirmBooking(), { wrapper });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      const mutationResult = await result.current.mutateAsync('booking-id');

      expect(mutationResult).toEqual(mockBooking);
      expect(supabase.from).toHaveBeenCalledWith('bookings');
    });
  });
});

