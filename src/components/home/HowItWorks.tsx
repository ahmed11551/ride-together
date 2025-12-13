import { Search, CalendarCheck, Car, MessageCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Найди поездку",
    description: "Укажи откуда и куда едешь, выбери дату",
  },
  {
    icon: CalendarCheck,
    title: "Забронируй место",
    description: "Выбери подходящую поездку и забронируй",
  },
  {
    icon: MessageCircle,
    title: "Свяжись с водителем",
    description: "Обсуди детали в чате приложения",
  },
  {
    icon: Car,
    title: "Путешествуй!",
    description: "Оплати на месте или онлайн — и в путь",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-12">
      <div className="container">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">
          Как это работает
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative flex flex-col items-center text-center animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
              
              {/* Step number */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-glow">
                  <step.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-sm font-bold flex items-center justify-center">
                  {index + 1}
                </div>
              </div>

              <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
