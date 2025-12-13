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
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary">
              <Car className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">RideConnect</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="/search" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Найти поездку
            </a>
            <a href="/create-ride" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Опубликовать
            </a>
            {user && (
              <a href="/my-rides" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Мои поездки
              </a>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => navigate("/profile")}>
                <User className="w-5 h-5" />
              </Button>
            ) : (
              <Button variant="soft" className="hidden md:flex" onClick={() => navigate("/auth")}>
                <LogIn className="w-4 h-4 mr-2" />
                Войти
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
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
