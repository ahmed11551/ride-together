import { X, Search, PlusCircle, Car, User, Settings, HelpCircle, LogIn, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useReports";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  if (!isOpen) return null;

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate("/");
  };

  const menuItems = [
    { icon: Search, label: "Найти поездку", href: "/search" },
    { icon: PlusCircle, label: "Опубликовать поездку", href: "/create-ride" },
    ...(user ? [
      { icon: Car, label: "Мои поездки", href: "/my-rides" },
      { icon: User, label: "Профиль", href: "/profile" },
      ...(isAdmin ? [{ icon: Shield, label: "Админ панель", href: "/admin" }] : []),
    ] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-card shadow-lg animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-bold text-lg">Меню</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-accent transition-colors text-left"
              onClick={() => handleNav(item.href)}
            >
              <item.icon className="w-5 h-5 text-primary" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          {user ? (
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          ) : (
            <Button variant="hero" className="w-full" onClick={() => handleNav("/auth")}>
              <LogIn className="w-4 h-4 mr-2" />
              Войти
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
