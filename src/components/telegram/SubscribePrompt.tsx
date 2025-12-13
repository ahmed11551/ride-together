import { useEffect, useState } from "react";
import { useTelegram } from "@/contexts/TelegramContext";
import { useBotSubscription, useCreateSubscription } from "@/hooks/useTelegramSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, X, Sparkles } from "lucide-react";
import { env } from "@/lib/env";

interface SubscribePromptProps {
  onDismiss?: () => void;
  showInWebApp?: boolean;
}

/**
 * Component to prompt users to subscribe to Telegram bot
 * Shows benefits and subscription button
 */
export function SubscribePrompt({ onDismiss, showInWebApp = false }: SubscribePromptProps) {
  const { isTelegram, webApp, user: telegramUser } = useTelegram();
  const { data: botSubscription, isLoading } = useBotSubscription();
  const createSubscription = useCreateSubscription();
  const [isDismissed, setIsDismissed] = useState(false);

  const botUsername = env.VITE_TELEGRAM_BOT_TOKEN
    ? "RideConnectBot" // Замените на имя вашего бота
    : "RideConnectBot";

  const handleSubscribe = () => {
    if (isTelegram && webApp) {
      // Открываем бота в Telegram
      webApp.openTelegramLink(`https://t.me/${botUsername}?start=subscribe`);
    } else {
      // Для веб-версии открываем ссылку на бота
      window.open(`https://t.me/${botUsername}?start=subscribe`, "_blank");
    }

    // Создаем подписку
    createSubscription.mutate("free");
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
    // Сохраняем в localStorage, чтобы не показывать снова
    localStorage.setItem("telegram_subscribe_dismissed", "true");
  };

  useEffect(() => {
    // Проверяем, было ли окно уже закрыто
    const dismissed = localStorage.getItem("telegram_subscribe_dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  // Не показываем, если уже подписан или закрыто
  if (isDismissed || botSubscription?.is_subscribed || (!isTelegram && !showInWebApp)) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Подпишитесь на бота</CardTitle>
              <CardDescription className="text-sm">
                Получайте уведомления и эксклюзивные предложения
              </CardDescription>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Уведомления о новых поездках</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Напоминания о бронированиях</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Специальные предложения</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Быстрый доступ к приложению</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="soft" className="gap-1">
            <Sparkles className="w-3 h-3" />
            Сейчас бесплатно
          </Badge>
        </div>

        <Button
          onClick={handleSubscribe}
          className="w-full"
          disabled={createSubscription.isPending}
        >
          {createSubscription.isPending ? (
            "Подключение..."
          ) : (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Подписаться на бота
            </>
          )}
        </Button>

        {isTelegram && (
          <p className="text-xs text-muted-foreground text-center">
            Откроется бот в Telegram
          </p>
        )}
      </CardContent>
    </Card>
  );
}

