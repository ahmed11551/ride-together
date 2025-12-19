import { Button } from "@/components/ui/button";
import { Car, Wallet, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const benefits = [
  { icon: Wallet, text: "Зарабатывайте на каждой поездке" },
  { icon: Calendar, text: "Гибкий график — вы сами решаете" },
  { icon: CheckCircle2, text: "Бесплатная регистрация" },
];

const DriverCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10 md:py-12">
      <div className="container">
        <div className="bg-gradient-to-br from-card via-card to-primary-light/20 rounded-3xl p-6 md:p-10 shadow-card relative overflow-hidden border border-border/50">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-72 h-72 gradient-primary opacity-10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 gradient-secondary opacity-10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
          
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-primary-light text-primary text-sm font-medium mb-4">
                Для водителей
              </span>
              
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4 leading-tight">
                Стань водителем
                <span className="block text-primary">Ride Together</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Публикуй поездки и получай дополнительный доход. Присоединяйся к сообществу водителей.
              </p>
              
              <ul className="space-y-3 mb-8">
                {benefits.map((benefit, index) => (
                  <li 
                    key={index} 
                    className="flex items-center gap-3 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                      <benefit.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">{benefit.text}</span>
                  </li>
                ))}
              </ul>

              <Button variant="hero" size="lg" onClick={() => navigate("/create-ride")}>
                Опубликовать поездку
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="hidden md:flex justify-center items-center">
              <div className="relative w-56 h-56">
                <div className="absolute inset-0 rounded-full gradient-primary opacity-15 animate-pulse-soft" />
                <div className="absolute inset-4 rounded-full bg-primary-light/50 animate-pulse-soft" style={{ animationDelay: "0.5s" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Car className="w-20 h-20 text-primary animate-float" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DriverCTA;
