import { ArrowRight, TrendingUp } from "lucide-react";

const popularRoutes = [
  { from: "Москва", to: "Санкт-Петербург", price: "от 1 500 ₽", count: 234 },
  { from: "Москва", to: "Казань", price: "от 1 800 ₽", count: 156 },
  { from: "Москва", to: "Нижний Новгород", price: "от 900 ₽", count: 189 },
  { from: "Санкт-Петербург", to: "Великий Новгород", price: "от 600 ₽", count: 98 },
];

const PopularRoutes = () => {
  return (
    <section className="py-8 bg-muted/30">
      <div className="container">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Популярные маршруты</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {popularRoutes.map((route, index) => (
            <button
              key={index}
              className="flex items-center justify-between p-4 bg-card rounded-xl shadow-sm hover:shadow-card transition-all duration-200 group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="font-semibold">{route.from}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="font-semibold">{route.to}</span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-primary">{route.price}</p>
                <p className="text-xs text-muted-foreground">{route.count} поездок</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularRoutes;
