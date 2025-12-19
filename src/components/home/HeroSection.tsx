import SearchForm from "@/components/search/SearchForm";
import { Shield, Clock, Wallet, Sparkles } from "lucide-react";

const HeroSection = () => {
  const features = [
    { icon: Shield, label: "Безопасно", desc: "Проверенные водители" },
    { icon: Clock, label: "Быстро", desc: "Бронь за 3 клика" },
    { icon: Wallet, label: "Выгодно", desc: "До 75% экономии" },
  ];

  return (
    <section className="relative gradient-hero pt-6 pb-12 md:pt-10 md:pb-16 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-10 w-20 h-20 bg-warning/20 rounded-full blur-2xl pointer-events-none animate-pulse-soft" />
      
      <div className="container relative">
        {/* Hero Text */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Новый способ путешествовать</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4 leading-tight tracking-tight">
            Путешествуй вместе
            <span className="block bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              с Ride Together
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Находи попутчиков для поездок. Безопасно, быстро и выгодно.
          </p>
        </div>

        {/* Search Form - более заметная */}
        <div className="max-w-2xl mx-auto mb-8 md:mb-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="relative">
            <SearchForm />
            {/* Декоративный элемент для привлечения внимания */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-warning rounded-full animate-pulse hidden md:block" />
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: "200ms" }}>
          {features.map((feature, index) => (
            <div 
              key={feature.label}
              className="flex flex-col items-center text-center p-3 md:p-4 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-card transition-all duration-300"
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl gradient-primary flex items-center justify-center mb-2 md:mb-3 shadow-glow">
                <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <p className="font-bold text-foreground text-sm md:text-base">{feature.label}</p>
              <p className="text-xs text-muted-foreground hidden md:block">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
