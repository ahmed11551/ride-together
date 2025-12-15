import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCreateReport, useMyReports, useIsAdmin } from '../useReports';
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

describe('useReports', () => {
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

  describe('useCreateReport', () => {
    it('should create report successfully', async () => {
      const mockReport = {
        id: 'report-1',
        reporter_id: 'user-id',
        reported_user_id: 'user-2',
        reason: 'spam',
        description: 'Test report',
        status: 'pending',
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockReport, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as never);

      const { result } = renderHook(() => useCreateReport(), { wrapper });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      const mutationResult = await result.current.mutateAsync({
        reported_user_id: 'user-2',
        reason: 'spam',
        description: 'Test report',
      });

      expect(mutationResult).toEqual(mockReport);
    });
  });

  describe('useMyReports', () => {
    it('should fetch user reports successfully', async () => {
      const mockReports = [
        {
          id: 'report-1',
          reporter_id: 'user-id',
          reported_user_id: 'user-2',
          reason: 'spam',
          status: 'pending',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockReports, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as never);

      const { result } = renderHook(() => useMyReports(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockReports);
    });
  });

  describe('useIsAdmin', () => {
    it('should return true for admin user', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as never);

      const { result } = renderHook(() => useIsAdmin(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(true);
    });

    it('should return false for non-admin user', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as never);

      const { result } = renderHook(() => useIsAdmin(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(false);
    });
  });
});

