import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ReviewForm } from "./ReviewForm";
import { useCanReviewRide } from "@/hooks/useReviews";
import { Star } from "lucide-react";

interface ReviewPromptProps {
  rideId: string;
  rideTitle: string;
}

export const ReviewPrompt = ({ rideId, rideTitle }: ReviewPromptProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: canReview, isLoading } = useCanReviewRide(rideId);

  if (isLoading || !canReview?.canReview) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Star className="w-4 h-4" />
        Оставить отзыв
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Оставить отзыв</DialogTitle>
            <DialogDescription>
              Поделитесь своими впечатлениями о поездке {rideTitle}
            </DialogDescription>
          </DialogHeader>
          <ReviewForm
            rideId={rideId}
            toUserId={canReview.otherUserId!}
            onSuccess={() => setIsOpen(false)}
            onCancel={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

