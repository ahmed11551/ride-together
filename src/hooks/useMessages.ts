import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { subscribe, sendMessage, connectWebSocket } from "@/lib/websocket-client";

export interface Message {
  id: string;
  ride_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useMessages = (rideId: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const messagesQuery = useQuery({
    queryKey: ["messages", rideId],
    queryFn: async () => {
      if (!rideId) return [];
      return apiClient.get<Message[]>(`/api/messages/${rideId}`);
    },
    enabled: !!rideId && !!user,
  });

  useEffect(() => {
    if (!rideId || !user) return;

    connectWebSocket().catch(console.error);

    const unsubscribe = subscribe('new-message', (message: Message) => {
      if (message.ride_id === rideId) {
        queryClient.setQueryData<Message[]>(["messages", rideId], (old = []) => {
          if (old.some((m) => m.id === message.id)) return old;
          return [...old, message];
        });
      }
    });

    sendMessage('join-ride', { rideId });

    return () => {
      unsubscribe();
      sendMessage('leave-ride', { rideId });
    };
  }, [rideId, user, queryClient]);

  return messagesQuery;
};

export const useSendMessage = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ rideId, content }: { rideId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");

      return apiClient.post<Message>('/api/messages', {
        ride_id: rideId,
        content: content.trim(),
      });
    },
  });
};

export const useCanAccessChat = (rideId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["canAccessChat", rideId, user?.id],
    queryFn: async () => {
      if (!rideId || !user) return false;

      const ride = await apiClient.get<{ driver_id: string }>(`/api/rides/${rideId}`);
      if (ride?.driver_id === user.id) return true;

      const bookings = await apiClient.get<{ passenger_id: string; status: string }[]>(
        `/api/bookings/ride/${rideId}`
      );
      return bookings.some(
        (b) => b.passenger_id === user.id && (b.status === 'pending' || b.status === 'confirmed')
      );
    },
    enabled: !!rideId && !!user,
  });
};
