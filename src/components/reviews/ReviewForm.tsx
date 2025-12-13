import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateReview } from "@/hooks/useReviews";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError, logError } from "@/lib/error-handler";
import { Star } from "lucide-react";

interface ReviewFormProps {
  rideId: string;
  toUserId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm = ({ rideId, toUserId, onSuccess, onCancel }: ReviewFormProps) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const createReview = useCreateReview();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createReview.mutateAsync({
        ride_id: rideId,
        to_user_id: toUserId,
        rating,
        comment: comment.trim() || undefined,
      });

      toast({
        title: "Отзыв оставлен!",
        description: "Спасибо за ваш отзыв",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      logError(error, "createReview");
      const friendlyError = getUserFriendlyError(error);
      toast({
        variant: "destructive",
        title: friendlyError.title,
        description: friendlyError.description,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Оценка</Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredRating || rating)
                    ? "fill-warning text-warning"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {rating} из 5
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Комментарий (опционально)</Label>
        <Textarea
          id="comment"
          placeholder="Поделитесь своими впечатлениями о поездке..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {comment.length}/500
        </p>
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Отмена
          </Button>
        )}
        <Button
          type="submit"
          variant="default"
          className="flex-1"
          disabled={createReview.isPending}
        >
          {createReview.isPending ? "Отправка..." : "Отправить отзыв"}
        </Button>
      </div>
    </form>
  );
};

