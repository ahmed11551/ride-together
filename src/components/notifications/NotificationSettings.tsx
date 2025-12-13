import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    permission,
    isSupported,
    initializeNotifications,
    unsubscribeFromPush,
  } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Проверяем, подписан ли пользователь
  useEffect(() => {
    if (user && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(subscription !== null);
        });
      });
    }
  }, [user]);

  const handleEnable = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Войдите в аккаунт для включения уведомлений',
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await initializeNotifications();
      if (success) {
        setIsSubscribed(true);
        toast({
          title: 'Уведомления включены',
          description: 'Вы будете получать уведомления о новых сообщениях и бронированиях',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Не удалось включить уведомления',
          description: 'Разрешите уведомления в настройках браузера',
        });
      }
    } catch (error) {
      console.error('Ошибка включения уведомлений:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось включить уведомления',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
        toast({
          title: 'Уведомления отключены',
        });
      }
    } catch (error) {
      console.error('Ошибка отключения уведомлений:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось отключить уведомления',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <BellOff className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-bold text-lg">Уведомления</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          <span>Ваш браузер не поддерживает push-уведомления</span>
        </div>
      </div>
    );
  }

  const isEnabled = permission === 'granted' && isSubscribed;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Push-уведомления</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor="notifications" className="text-base font-medium">
              Включить уведомления
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Получайте уведомления о новых сообщениях, бронированиях и обновлениях
            </p>
          </div>
          <Switch
            id="notifications"
            checked={isEnabled}
            onCheckedChange={(checked) => {
              if (checked) {
                handleEnable();
              } else {
                handleDisable();
              }
            }}
            disabled={isLoading || permission === 'denied'}
          />
        </div>

        {permission === 'default' && !isEnabled && (
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Разрешение не запрошено</p>
              <p className="text-xs text-muted-foreground mt-1">
                Включите уведомления, чтобы получать важные обновления
              </p>
            </div>
          </div>
        )}

        {permission === 'granted' && isEnabled && (
          <div className="flex items-start gap-2 p-3 bg-success-light rounded-lg">
            <CheckCircle className="w-4 h-4 text-success mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-success">Уведомления включены</p>
              <p className="text-xs text-muted-foreground mt-1">
                Вы будете получать уведомления о новых событиях
              </p>
            </div>
          </div>
        )}

        {permission === 'denied' && (
          <div className="flex items-start gap-2 p-3 bg-destructive-light rounded-lg">
            <XCircle className="w-4 h-4 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                Уведомления заблокированы
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Разрешите уведомления в настройках браузера, чтобы получать обновления
              </p>
            </div>
          </div>
        )}

        {isEnabled && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Вы будете получать уведомления о:
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Новых сообщениях в чате поездки</li>
              <li>Новых бронированиях ваших поездок</li>
              <li>Подтверждении ваших бронирований</li>
              <li>Отмене поездок</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

