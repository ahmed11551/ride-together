import { useNavigate } from "react-router-dom";
import {
  useSavedSearches,
  useUpdateSavedSearch,
  useDeleteSavedSearch,
  savedSearchToParams,
} from "@/hooks/useSavedSearches";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bell, Search, Trash2, Bookmark } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export const SavedSearchesList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: searches = [], isLoading } = useSavedSearches();
  const updateSearch = useUpdateSavedSearch();
  const deleteSearch = useDeleteSavedSearch();

  const handleToggleNotify = async (id: string, notifyTelegram: boolean) => {
    try {
      await updateSearch.mutateAsync({ id, notifyTelegram });
      toast({
        title: notifyTelegram ? "Уведомления включены" : "Уведомления отключены",
        description: notifyTelegram
          ? "Мы пришлём сообщение в Telegram, когда появится подходящая поездка"
          : "Поиск сохранён, но уведомления отключены",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить настройки",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSearch.mutateAsync(id);
      toast({ title: "Поиск удалён" });
    } catch {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить поиск",
      });
    }
  };

  const handleRunSearch = (search: (typeof searches)[0]) => {
    const params = savedSearchToParams(search);
    navigate(`/search?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <div className="animate-pulse text-muted-foreground text-sm">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <Bookmark className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Сохранённые поиски</h3>
      </div>

      {searches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Сохраните поиск на странице результатов — мы уведомим вас в Telegram о новых поездках по
          маршруту.
        </p>
      ) : (
        <div className="space-y-3">
          {searches.map((search) => {
            const route = `${search.fromCity || "Любой город"} → ${search.toCity || "Любой город"}`;
            const dateLabel = search.date
              ? format(new Date(search.date), "d MMMM yyyy", { locale: ru })
              : "Любая дата";

            return (
              <div
                key={search.id}
                className="p-4 rounded-xl border border-border bg-muted/30 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{search.name || route}</p>
                    {search.name && (
                      <p className="text-sm text-muted-foreground truncate">{route}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {dateLabel} • {search.passengers || 1} пасс.
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRunSearch(search)}
                      aria-label="Выполнить поиск"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(search.id)}
                      disabled={deleteSearch.isPending}
                      aria-label="Удалить поиск"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor={`notify-${search.id}`} className="text-sm cursor-pointer">
                      Telegram-напоминания
                    </Label>
                  </div>
                  <Switch
                    id={`notify-${search.id}`}
                    checked={search.notifyTelegram}
                    onCheckedChange={(checked) => handleToggleNotify(search.id, checked)}
                    disabled={updateSearch.isPending}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
