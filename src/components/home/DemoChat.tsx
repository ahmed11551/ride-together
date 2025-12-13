import { useState, useEffect } from 'react';
import { MessageCircle, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

/**
 * Демо-чат для показа на главной странице
 * Показывает, как работает чат в приложении
 */
const DEMO_MESSAGES = [
  {
    id: '1',
    sender: 'Алексей П.',
    content: 'Привет! Готовы к поездке?',
    time: '10:30',
    isMe: false,
  },
  {
    id: '2',
    sender: 'Вы',
    content: 'Да, спасибо! Во сколько встречаемся?',
    time: '10:32',
    isMe: true,
  },
  {
    id: '3',
    sender: 'Алексей П.',
    content: 'В 8:00 у м. ВДНХ, выход 1. Моя машина белая, номер А123БВ',
    time: '10:33',
    isMe: false,
  },
  {
    id: '4',
    sender: 'Вы',
    content: 'Отлично, буду вовремя!',
    time: '10:35',
    isMe: true,
  },
];

export const DemoChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(DEMO_MESSAGES.slice(0, 2));
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Автоматически показываем сообщения с задержкой
    if (!isExpanded) {
      const timer = setTimeout(() => {
        setMessages(DEMO_MESSAGES.slice(0, 3));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (isExpanded) {
      // Показываем все сообщения при раскрытии
      setMessages(DEMO_MESSAGES);
    }
  }, [isExpanded]);

  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Чат поездки</h3>
              <p className="text-xs text-muted-foreground">Общайтесь с водителем и пассажирами</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Свернуть' : 'Развернуть'}
          </Button>
        </div>
      </div>

      <div className={`${isExpanded ? 'h-[400px]' : 'h-[200px]'} overflow-y-auto p-4 space-y-3 bg-muted/30 transition-all duration-300`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.isMe ? 'justify-end' : 'justify-start'}`}
          >
            {!message.isMe && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.isMe
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
              }`}
            >
              {!message.isMe && (
                <p className="text-xs font-medium mb-1 opacity-80">
                  {message.sender}
                </p>
              )}
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${message.isMe ? 'opacity-70' : 'text-muted-foreground'}`}>
                {message.time}
              </p>
            </div>
            {message.isMe && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
        ))}
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Напишите сообщение..."
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled
            />
            <Button size="sm" disabled>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Это демо-чат. В реальной поездке вы сможете общаться с водителем и пассажирами
          </p>
        </div>
      )}

      <div className="p-4 border-t border-border bg-primary/5">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/search')}
        >
          Найти поездку и начать общение
          <MessageCircle className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

