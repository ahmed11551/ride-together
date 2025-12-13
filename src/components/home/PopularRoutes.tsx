import { ArrowRight, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const popularRoutes = [
  { from: "Москва", to: "Санкт-Петербург", price: "от 1 500 ₽", count: 234 },
  { from: "Москва", to: "Казань", price: "от 1 800 ₽", count: 156 },
  { from: "Москва", to: "Нижний Новгород", price: "от 900 ₽", count: 189 },
  { from: "Санкт-Петербург", to: "Великий Новгород", price: "от 600 ₽", count: 98 },
];

const PopularRoutes = () => {
  const navigate = useNavigate();

  const handleRouteClick = (from: string, to: string) => {
    navigate(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  };

  return (
    <section className="py-8 bg-muted/40">
      <div className="container">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-foreground">Популярные маршруты</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {popularRoutes.map((route, index) => (
            <button
              key={index}
              className="flex items-center justify-between p-4 md:p-5 bg-card rounded-xl shadow-xs hover:shadow-card hover:scale-[1.02] transition-all duration-200 group text-left animate-fade-in border border-border/50 hover:border-primary/30"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleRouteClick(route.from, route.to)}
            >
              <div className="flex items-center gap-2 text-foreground min-w-0">
                <span className="font-semibold truncate">{route.from}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                <span className="font-semibold truncate">{route.to}</span>
              </div>
              
              <div className="text-right shrink-0 ml-3">
                <p className="font-bold text-primary text-sm">{route.price}</p>
                <p className="text-xs text-muted-foreground">
                  {route.count} {route.count === 1 ? 'поездка' : route.count < 5 ? 'поездки' : 'поездок'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularRoutes;
