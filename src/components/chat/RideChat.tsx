import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages, useSendMessage, useCanAccessChat } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, Lock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RideChatProps {
  rideId: string;
  driverId: string;
}

const RideChat = ({ rideId, driverId }: RideChatProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: messages = [], isLoading: messagesLoading } = useMessages(rideId);
  const { data: canAccess, isLoading: accessLoading } = useCanAccessChat(rideId);
  const sendMessage = useSendMessage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessage.isPending) return;

    try {
      await sendMessage.mutateAsync({ rideId, content: message });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!user) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <div className="flex flex-col items-center justify-center gap-3 text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Войдите, чтобы использовать чат</p>
        </div>
      </div>
    );
  }

  if (accessLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <div className="flex flex-col items-center justify-center gap-3 text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Чат для участников поездки</p>
            <p className="text-sm text-muted-foreground">Забронируйте поездку, чтобы написать водителю</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Чат поездки</h2>
          {messages.length > 0 && (
            <span className="text-xs text-muted-foreground">({messages.length} сообщений)</span>
          )}
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="h-[300px] overflow-y-auto p-4 space-y-3"
      >
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground text-sm">Нет сообщений</p>
            <p className="text-muted-foreground text-xs">Начните общение с участниками поездки</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user.id;
            const isDriver = msg.sender_id === driverId;
            const senderName = msg.sender?.full_name || "Пользователь";
            const avatarUrl = msg.sender?.avatar_url || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=0d9488&color=fff&size=32`;

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  isOwn ? "flex-row-reverse" : "flex-row"
                )}
              >
                {!isOwn && (
                  <img
                    src={avatarUrl}
                    alt={senderName}
                    className="w-8 h-8 rounded-full shrink-0"
                  />
                )}
                <div className={cn("max-w-[75%]", isOwn ? "text-right" : "text-left")}>
                  {!isOwn && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-medium text-foreground">{senderName}</span>
                      {isDriver && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                          Водитель
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 inline-block",
                      isOwn 
                        ? "bg-primary text-primary-foreground rounded-br-md" 
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <p className={cn(
                    "text-[10px] text-muted-foreground mt-1",
                    isOwn ? "text-right" : "text-left"
                  )}>
                    {format(new Date(msg.created_at), "HH:mm", { locale: ru })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sendMessage.isPending}
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RideChat;
