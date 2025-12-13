import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateReport } from "@/hooks/useReports";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError, logError } from "@/lib/error-handler";
import { Flag } from "lucide-react";

interface ReportDialogProps {
  reportedUserId: string;
  rideId?: string;
  rideTitle?: string;
  trigger?: React.ReactNode;
}

const REPORT_REASONS = [
  "Некорректное поведение",
  "Неявка на поездку",
  "Небезопасное вождение",
  "Мошенничество",
  "Спам",
  "Другое",
];

export const ReportDialog = ({
  reportedUserId,
  rideId,
  rideTitle,
  trigger,
}: ReportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const createReport = useCreateReport();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите причину жалобы",
      });
      return;
    }

    try {
      await createReport.mutateAsync({
        reported_user_id: reportedUserId,
        ride_id: rideId,
        reason,
        description: description.trim() || undefined,
      });

      toast({
        title: "Жалоба отправлена",
        description: "Мы рассмотрим вашу жалобу в ближайшее время",
      });

      setIsOpen(false);
      setReason("");
      setDescription("");
    } catch (error) {
      logError(error, "createReport");
      const friendlyError = getUserFriendlyError(error);
      toast({
        variant: "destructive",
        title: friendlyError.title,
        description: friendlyError.description,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Flag className="w-4 h-4" />
            Пожаловаться
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Пожаловаться на пользователя</DialogTitle>
          <DialogDescription>
            {rideTitle && `Поездка: ${rideTitle}`}
            <br />
            Ваша жалоба будет рассмотрена модераторами
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Причина жалобы *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Выберите причину" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание (опционально)</Label>
            <Textarea
              id="description"
              placeholder="Опишите ситуацию подробнее..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="default"
              className="flex-1"
              disabled={createReport.isPending || !reason}
            >
              {createReport.isPending ? "Отправка..." : "Отправить жалобу"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

