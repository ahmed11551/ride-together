import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateSavedSearch, useSavedSearches } from "@/hooks/useSavedSearches";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, Bookmark, Loader2 } from "lucide-react";

interface SaveSearchButtonProps {
  from: string;
  to: string;
  date: string;
  passengers: number;
  variant?: "default" | "outline" | "soft";
  className?: string;
}

export const SaveSearchButton = ({
  from,
  to,
  date,
  passengers,
  variant = "outline",
  className,
}: SaveSearchButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createSearch = useCreateSavedSearch();
  const { data: existing = [] } = useSavedSearches();
  const [saved, setSaved] = useState(false);

  const isDuplicate = existing.some(
    (s) =>
      (s.fromCity || "") === from &&
      (s.toCity || "") === to &&
      (s.date || "") === date &&
      (s.passengers || 1) === passengers
  );

  const handleSave = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!from && !to) {
      toast({
        variant: "destructive",
        title: "Укажите маршрут",
        description: "Для сохранения нужен хотя бы город отправления или прибытия",
      });
      return;
    }

    if (isDuplicate || saved) {
      toast({
        title: "Поиск уже сохранён",
        description: "Управляйте сохранёнными поисками в профиле",
      });
      return;
    }

    try {
      const name = [from, to].filter(Boolean).join(" → ") || "Мой поиск";
      await createSearch.mutateAsync({
        name,
        fromCity: from || undefined,
        toCity: to || undefined,
        date: date || undefined,
        passengers,
        notifyTelegram: true,
      });
      setSaved(true);
      toast({
        title: "Поиск сохранён",
        description:
          "Мы пришлём уведомление в Telegram, когда появится подходящая поездка. Привяжите Telegram в профиле, если ещё не сделали это.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось сохранить поиск",
      });
    }
  };

  const isDisabled = createSearch.isPending || saved || isDuplicate;

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleSave}
      disabled={isDisabled}
    >
      {createSearch.isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : saved || isDuplicate ? (
        <Bookmark className="w-4 h-4 mr-2 fill-current" />
      ) : (
        <Bell className="w-4 h-4 mr-2" />
      )}
      {saved || isDuplicate ? "Поиск сохранён" : "Сохранить + Telegram"}
    </Button>
  );
};
