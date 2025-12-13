import { Car, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import MobileMenu from "./MobileMenu";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary">
              <Car className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">RideConnect</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Найти поездку
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Опубликовать
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Мои поездки
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <User className="w-5 h-5" />
            </Button>
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
