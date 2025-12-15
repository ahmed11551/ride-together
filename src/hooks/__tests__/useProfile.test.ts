import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useProfile, useUpdateProfile } from '../useProfile';
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

describe('useProfile', () => {
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

  describe('useProfile', () => {
    it('should fetch profile successfully', async () => {
      const mockProfile = {
        id: 'user-id',
        user_id: 'user-id',
        full_name: 'Test User',
        phone: '+79001234567',
        rating: 4.5,
        trips_count: 10,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as never);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProfile);
    });

    it('should return null when profile not found', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as never);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('useUpdateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUpdatedProfile = {
        id: 'user-id',
        user_id: 'user-id',
        full_name: 'Updated Name',
        phone: '+79001234567',
      };

      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'user-id' }, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null }),
              }),
            }),
          }),
        });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as never);

      const { result } = renderHook(() => useUpdateProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      const mutationResult = await result.current.mutateAsync({
        full_name: 'Updated Name',
      });

      expect(mutationResult).toEqual(mockUpdatedProfile);
    });
  });
});

