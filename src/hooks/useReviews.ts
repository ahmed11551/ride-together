import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Review {
  id: string;
  ride_id: string;
  from_user_id: string;
  to_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  from_user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  to_user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface ReviewInput {
  ride_id: string;
  to_user_id: string;
  rating: number;
  comment?: string;
}

/**
 * Get reviews for a specific user
 */
export const useUserReviews = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["reviews", "user", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("to_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles
      const userIds = [
        ...new Set(data?.flatMap(r => [r.from_user_id, r.to_user_id]) || []),
      ];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(review => ({
        ...review,
        from_user: profileMap.get(review.from_user_id),
        to_user: profileMap.get(review.to_user_id),
      })) as Review[];
    },
    enabled: !!userId,
  });
};

/**
 * Get reviews for a specific ride
 */
export const useRideReviews = (rideId: string | undefined) => {
  return useQuery({
    queryKey: ["reviews", "ride", rideId],
    queryFn: async () => {
      if (!rideId) return [];

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles
      const userIds = [
        ...new Set(data?.flatMap(r => [r.from_user_id, r.to_user_id]) || []),
      ];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(review => ({
        ...review,
        from_user: profileMap.get(review.from_user_id),
        to_user: profileMap.get(review.to_user_id),
      })) as Review[];
    },
    enabled: !!rideId,
  });
};

/**
 * Check if user can leave a review for a completed ride
 */
export const useCanReviewRide = (rideId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["can-review", rideId, user?.id],
    queryFn: async () => {
      if (!rideId || !user) return { canReview: false, reason: null };

      // Check if ride is completed
      const { data: ride } = await supabase
        .from("rides")
        .select("id, driver_id, status")
        .eq("id", rideId)
        .single();

      if (!ride || ride.status !== "completed") {
        return { canReview: false, reason: "Поездка не завершена" };
      }

      // Check if user was part of the ride
      const isDriver = ride.driver_id === user.id;
      const { data: booking } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("ride_id", rideId)
        .eq("passenger_id", user.id)
        .eq("status", "completed")
        .maybeSingle();

      if (!isDriver && !booking) {
        return { canReview: false, reason: "Вы не участвовали в поездке" };
      }

      // Check if review already exists
      const otherUserId = isDriver
        ? booking?.passenger_id || null
        : ride.driver_id;

      if (!otherUserId) {
        return { canReview: false, reason: "Не найден второй участник" };
      }

      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("ride_id", rideId)
        .eq("from_user_id", user.id)
        .eq("to_user_id", otherUserId)
        .maybeSingle();

      if (existingReview) {
        return { canReview: false, reason: "Отзыв уже оставлен" };
      }

      return {
        canReview: true,
        reason: null,
        otherUserId,
      };
    },
    enabled: !!rideId && !!user,
  });
};

/**
 * Create a review
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (review: ReviewInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          ...review,
          from_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user rating
      await updateUserRating(review.to_user_id);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["can-review"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
};

/**
 * Update user ratings (both driver and passenger) based on all reviews
 * Uses database function for accurate calculation
 */
async function updateUserRating(userId: string) {
  // Use database function to update both driver and passenger ratings
  const { error } = await supabase.rpc('update_user_ratings', {
    p_user_id: userId
  });

  if (error) {
    console.error('Error updating user ratings:', error);
    // Fallback to old method if RPC fails
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("to_user_id", userId);

    if (!reviews || reviews.length === 0) return;

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await supabase
      .from("profiles")
      .update({ rating: avgRating })
      .eq("user_id", userId);
  }
}

