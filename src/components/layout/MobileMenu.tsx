import { X, Search, PlusCircle, Car, User, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  if (!isOpen) return null;

  const menuItems = [
    { icon: Search, label: "Найти поездку", href: "#" },
    { icon: PlusCircle, label: "Опубликовать поездку", href: "#" },
    { icon: Car, label: "Мои поездки", href: "#" },
    { icon: User, label: "Профиль", href: "#" },
    { icon: Settings, label: "Настройки", href: "#" },
    { icon: HelpCircle, label: "Помощь", href: "#" },
  ];

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-card shadow-lg animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-bold text-lg">Меню</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-accent transition-colors"
              onClick={onClose}
            >
              <item.icon className="w-5 h-5 text-primary" />
              <span className="font-medium">{item.label}</span>
            </a>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <Button variant="hero" className="w-full">
            Войти через Telegram
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
