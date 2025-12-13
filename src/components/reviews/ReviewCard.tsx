import { Star } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Review } from "@/hooks/useReviews";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const fromUser = review.from_user;

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={fromUser?.avatar_url || undefined} />
          <AvatarFallback>
            {fromUser?.full_name?.[0] || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-sm">
              {fromUser?.full_name || "Анонимный пользователь"}
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= review.rating
                      ? "fill-warning text-warning"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-2">
            {format(new Date(review.created_at), "d MMMM yyyy", { locale: ru })}
          </p>

          {review.comment && (
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

