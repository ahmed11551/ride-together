import { Search, PlusCircle, Car, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const BottomNav = () => {
  const [activeTab, setActiveTab] = useState("search");

  const tabs = [
    { id: "search", icon: Search, label: "Поиск" },
    { id: "publish", icon: PlusCircle, label: "Создать" },
    { id: "rides", icon: Car, label: "Поездки" },
    { id: "messages", icon: MessageCircle, label: "Чаты" },
    { id: "profile", icon: User, label: "Профиль" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
              activeTab === tab.id 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-lg transition-colors",
              activeTab === tab.id && "bg-primary-light"
            )}>
              <tab.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
