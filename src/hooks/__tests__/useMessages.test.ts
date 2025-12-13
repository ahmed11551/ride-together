import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMessages, useSendMessage } from '../useMessages';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock notifications
vi.mock('@/lib/notifications', () => ({
  notifyNewMessage: vi.fn(),
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-id', email: 'test@example.com' },
    loading: false,
  }),
}));

describe('useMessages', () => {
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

  describe('useMessages', () => {
    it('should fetch messages successfully', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          ride_id: 'ride-1',
          sender_id: 'user-1',
          content: 'Test message',
          created_at: '2025-01-01T00:00:00Z',
          sender: { full_name: 'Test User' },
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockMessages, error: null }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockFrom());

      const { result } = renderHook(() => useMessages('ride-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMessages);
    });

    it('should return empty array when no messages', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockFrom());

      const { result } = renderHook(() => useMessages('ride-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useSendMessage', () => {
    it('should send message successfully', async () => {
      const mockMessage = {
        id: 'msg-1',
        ride_id: 'ride-1',
        sender_id: 'user-id',
        content: 'Test message',
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockMessage, error: null }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockFrom());

      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      const mutationResult = await result.current.mutateAsync({
        rideId: 'ride-1',
        content: 'Test message',
      });

      expect(mutationResult).toEqual(mockMessage);
    });
  });
});

