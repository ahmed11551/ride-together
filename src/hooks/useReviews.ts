import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
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

      const data = await apiClient.get<Review[]>(`/api/reviews?user_id=${userId}`);
      return data;
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

      const data = await apiClient.get<Review[]>(`/api/reviews?ride_id=${rideId}`);
      return data;
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
      const ride = await apiClient.get<{ driver_id: string; status: string }>(`/api/rides/${rideId}`);
      
      if (!ride || ride.status !== "completed") {
        return { canReview: false, reason: "Поездка не завершена" };
      }

      // Check if user was part of the ride
      const isDriver = ride.driver_id === user.id;
      
      if (!isDriver) {
        // Check if user has a completed booking
        const myBookings = await apiClient.get<Booking[]>('/api/bookings');
        const booking = myBookings.find(
          b => b.ride_id === rideId && 
          b.status === "completed"
        );
        
        if (!booking) {
          return { canReview: false, reason: "Вы не участвовали в поездке" };
        }
      }

      // Check if review already exists
      const reviews = await apiClient.get<Review[]>(`/api/reviews?ride_id=${rideId}`);
      const otherUserId = isDriver 
        ? (await apiClient.get<Booking[]>(`/api/bookings/ride/${rideId}`)).find(b => b.status === "completed")?.passenger_id
        : ride.driver_id;

      if (!otherUserId) {
        return { canReview: false, reason: "Не найден второй участник" };
      }

      const existingReview = reviews.find(
        r => r.from_user_id === user.id && r.to_user_id === otherUserId
      );

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

// Временный интерфейс для useCanReviewRide
interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: string;
}

/**
 * Create a review
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (review: ReviewInput) => {
      if (!user) throw new Error("Not authenticated");

      const data = await apiClient.post<Review>('/api/reviews', review);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["can-review"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
};
