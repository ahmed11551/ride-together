import { Button } from "@/components/ui/button";
import { Car, Wallet, Calendar, ArrowRight } from "lucide-react";

const benefits = [
  { icon: Wallet, text: "Зарабатывай на каждой поездке" },
  { icon: Calendar, text: "Гибкий график — ты сам решаешь когда" },
  { icon: Car, text: "Полная свобода выбора маршрутов" },
];

const DriverCTA = () => {
  return (
    <section className="py-12 bg-primary/5">
      <div className="container">
        <div className="bg-card rounded-3xl p-8 md:p-10 shadow-card relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 gradient-primary opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Стань водителем RideConnect
              </h2>
              <p className="text-muted-foreground mb-6">
                Публикуй поездки и получай дополнительный доход. Присоединяйся к сообществу из 50 000+ водителей.
              </p>
              
              <ul className="space-y-3 mb-8">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                      <benefit.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground">{benefit.text}</span>
                  </li>
                ))}
              </ul>

              <Button variant="hero" size="lg">
                Опубликовать поездку
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 rounded-full gradient-primary opacity-20 animate-pulse-soft" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Car className="w-24 h-24 text-primary animate-float" />
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
