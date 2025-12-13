import { Car, Menu, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MobileMenu from "./MobileMenu";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <button 
            className="flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1"
            onClick={() => navigate("/")}
            aria-label="Перейти на главную страницу"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary" aria-hidden="true">
              <Car className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">RideConnect</span>
          </button>

          <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Основная навигация">
            <a 
              href="/search" 
              className={`transition-colors font-medium ${
                window.location.pathname === '/search' 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-current={window.location.pathname === '/search' ? 'page' : undefined}
            >
              Найти поездку
            </a>
            <a 
              href="/create-ride" 
              className={`transition-colors font-medium ${
                window.location.pathname === '/create-ride' 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-current={window.location.pathname === '/create-ride' ? 'page' : undefined}
            >
              Опубликовать
            </a>
            {user && (
              <a 
                href="/my-rides" 
                className={`transition-colors font-medium ${
                  window.location.pathname === '/my-rides' 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-current={window.location.pathname === '/my-rides' ? 'page' : undefined}
              >
                Мои поездки
              </a>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex" 
                onClick={() => navigate("/profile")}
                aria-label="Открыть профиль"
              >
                <User className="w-5 h-5" />
              </Button>
            ) : (
              <Button 
                variant="soft" 
                className="hidden md:flex" 
                onClick={() => navigate("/auth")}
                aria-label="Войти в аккаунт"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Войти
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Открыть меню"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
};

export default Header;
