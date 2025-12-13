import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

      // Fetch messages
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch sender profiles for all unique sender_ids
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", senderIds);

      // Map profiles to messages
      const profileMap = new Map(profiles?.map(p => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }]));
      
      return messages.map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id) || undefined,
      })) as Message[];
    },
    enabled: !!rideId && !!user,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!rideId || !user) return;

    const channel = supabase
      .channel(`messages-${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `ride_id=eq.${rideId}`,
        },
        async (payload) => {
          // Fetch sender info for the new message
          const { data: senderData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", payload.new.sender_id)
            .maybeSingle();

          const newMessage: Message = {
            ...payload.new as Message,
            sender: senderData || undefined,
          };

          queryClient.setQueryData(["messages", rideId], (old: Message[] = []) => {
            // Avoid duplicates
            if (old.some((m) => m.id === newMessage.id)) return old;
            return [...old, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, user, queryClient]);

  return messagesQuery;
};

export const useSendMessage = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ rideId, content }: { rideId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          ride_id: rideId,
          sender_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Отправляем уведомления получателям (асинхронно, не блокируем)
      if (data) {
        sendMessageNotifications(rideId, user.id, content).catch((err) => {
          console.error('Ошибка отправки уведомлений:', err);
        });
      }

      return data;
    },
  });
};

/**
 * Отправка уведомлений о новом сообщении всем участникам поездки
 */
async function sendMessageNotifications(
  rideId: string,
  senderId: string,
  messageContent: string
): Promise<void> {
  try {
    // Получаем информацию о поездке и отправителе
    const { data: ride } = await supabase
      .from("rides")
      .select("driver_id")
      .eq("id", rideId)
      .single();

    if (!ride) return;

    // Получаем информацию об отправителе
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", senderId)
      .maybeSingle();

    const senderName = senderProfile?.full_name || "Пользователь";

    // Получаем всех участников чата (водитель + забронировавшие пассажиры)
    const { data: bookings } = await supabase
      .from("bookings")
      .select("passenger_id")
      .eq("ride_id", rideId)
      .in("status", ["pending", "confirmed"]);

    const recipientIds = new Set<string>();
    
    // Добавляем водителя (если не отправитель)
    if (ride.driver_id !== senderId) {
      recipientIds.add(ride.driver_id);
    }

    // Добавляем пассажиров (если не отправитель)
    bookings?.forEach((booking) => {
      if (booking.passenger_id !== senderId) {
        recipientIds.add(booking.passenger_id);
      }
    });

    // Импортируем функцию отправки уведомлений
    // Уведомление отправляется через статический импорт

    // Отправляем уведомления всем получателям
    await Promise.allSettled(
      Array.from(recipientIds).map((recipientId) =>
        notifyNewMessage(recipientId, rideId, senderName, messageContent)
      )
    );
  } catch (error) {
    console.error("Ошибка отправки уведомлений о сообщении:", error);
  }
}

export const useCanAccessChat = (rideId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["canAccessChat", rideId, user?.id],
    queryFn: async () => {
      if (!rideId || !user) return false;

      // Check if user is the driver
      const { data: ride } = await supabase
        .from("rides")
        .select("driver_id")
        .eq("id", rideId)
        .maybeSingle();

      if (ride?.driver_id === user.id) return true;

      // Check if user has a booking for this ride
      const { data: booking } = await supabase
        .from("bookings")
        .select("id")
        .eq("ride_id", rideId)
        .eq("passenger_id", user.id)
        .maybeSingle();

      return !!booking;
    },
    enabled: !!rideId && !!user,
  });
};
