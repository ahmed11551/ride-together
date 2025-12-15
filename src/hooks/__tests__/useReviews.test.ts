import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useReviews, useCreateReview } from '../useReviews';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-id', email: 'test@example.com' },
    loading: false,
  }),
}));

describe('useReviews', () => {
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

  describe('useReviews', () => {
    it('should fetch reviews successfully', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          ride_id: 'ride-1',
          from_user_id: 'user-1',
          to_user_id: 'user-2',
          rating: 5,
          comment: 'Great ride!',
          created_at: '2025-01-01T00:00:00Z',
          from_user: { full_name: 'Test User' },
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockReviews, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as never);

      const { result } = renderHook(() => useReviews('user-2'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockReviews);
    });
  });

  describe('useCreateReview', () => {
    it('should create review successfully', async () => {
      const mockReview = {
        id: 'review-1',
        ride_id: 'ride-1',
        from_user_id: 'user-id',
        to_user_id: 'user-2',
        rating: 5,
        comment: 'Great ride!',
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockReview, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as never);

      const { result } = renderHook(() => useCreateReview(), { wrapper });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      const mutationResult = await result.current.mutateAsync({
        rideId: 'ride-1',
        toUserId: 'user-2',
        rating: 5,
        comment: 'Great ride!',
      });

      expect(mutationResult).toEqual(mockReview);
    });
  });
});

