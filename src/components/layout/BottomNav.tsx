import { Search, PlusCircle, Car, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const tabs = [
    { id: "search", icon: Search, label: "Поиск", path: "/" },
    { id: "publish", icon: PlusCircle, label: "Создать", path: "/create-ride" },
    { id: "rides", icon: Car, label: "Поездки", path: "/my-rides" },
    { id: "profile", icon: User, label: "Профиль", path: user ? "/profile" : "/auth" },
  ];

  const handleNav = (path: string) => {
    navigate(path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom"
      role="navigation"
      aria-label="Мобильная навигация"
    >
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.path)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isActive
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive && "bg-primary-light"
              )}>
                <tab.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
