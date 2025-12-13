import { Search, CalendarCheck, MessageCircle, Car } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Найди поездку",
    description: "Укажи маршрут и дату",
  },
  {
    icon: CalendarCheck,
    title: "Забронируй место",
    description: "Выбери подходящую поездку",
  },
  {
    icon: MessageCircle,
    title: "Свяжись с водителем",
    description: "Обсуди детали в чате",
  },
  {
    icon: Car,
    title: "Путешествуй!",
    description: "Наслаждайся поездкой",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-10 md:py-12 bg-muted/30">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Как это работает
          </h2>
          <p className="text-muted-foreground">Всего 4 простых шага</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative flex flex-col items-center text-center animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Connector line - desktop only */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[55%] w-[90%] h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
              )}
              
              {/* Step icon */}
              <div className="relative mb-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                  <step.icon className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full gradient-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center shadow-sm ring-2 ring-background">
                  {index + 1}
                </div>
              </div>

              <h3 className="font-bold text-foreground mb-1 text-sm md:text-base">{step.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
