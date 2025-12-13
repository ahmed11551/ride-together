import SearchForm from "@/components/search/SearchForm";
import { Shield, Clock, Wallet } from "lucide-react";

const HeroSection = () => {
  const features = [
    { icon: Shield, label: "Безопасно", desc: "Проверенные водители" },
    { icon: Clock, label: "Быстро", desc: "Бронь за 3 клика" },
    { icon: Wallet, label: "Выгодно", desc: "Лучшие цены" },
  ];

  return (
    <section className="relative gradient-hero pt-8 pb-16 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container relative">
        {/* Hero Text */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4 leading-tight">
            Путешествуй вместе
            <span className="block text-primary">с RideConnect</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Находи попутчиков или предлагай поездки. Экономь до 75% на дорогу.
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <SearchForm />
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: "200ms" }}>
          {features.map((feature) => (
            <div 
              key={feature.label}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-card/50 backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-3">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm">{feature.label}</p>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
