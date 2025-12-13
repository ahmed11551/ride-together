import RideCard from "./RideCard";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockRides = [
  {
    id: 1,
    driver: {
      name: "Александр М.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      rating: 4.9,
      trips: 156,
      verified: true,
    },
    from: "Москва, м. Тёплый Стан",
    to: "Санкт-Петербург, Московский вокзал",
    date: "2024-01-15",
    time: "08:00",
    duration: "≈ 7 часов",
    price: 1800,
    seats: 3,
    features: ["noSmoking", "music"],
    car: "Volkswagen Passat, серый",
  },
  {
    id: 2,
    driver: {
      name: "Мария К.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      rating: 4.8,
      trips: 89,
      verified: true,
    },
    from: "Москва, м. Домодедовская",
    to: "Санкт-Петербург, м. Звёздная",
    date: "2024-01-15",
    time: "09:30",
    duration: "≈ 8 часов",
    price: 1600,
    seats: 2,
    features: ["noSmoking", "chat"],
    car: "Kia Ceed, белый",
  },
  {
    id: 3,
    driver: {
      name: "Дмитрий В.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      rating: 4.7,
      trips: 234,
      verified: true,
    },
    from: "Москва, МКАД (Ленинградка)",
    to: "Санкт-Петербург, КАД",
    date: "2024-01-15",
    time: "10:00",
    duration: "≈ 6.5 часов",
    price: 2000,
    seats: 1,
    features: ["noSmoking", "music", "chat"],
    car: "BMW 520d, чёрный",
  },
  {
    id: 4,
    driver: {
      name: "Елена С.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      rating: 5.0,
      trips: 45,
      verified: false,
    },
    from: "Москва, м. Речной вокзал",
    to: "Санкт-Петербург, Пулково",
    date: "2024-01-15",
    time: "14:00",
    duration: "≈ 7.5 часов",
    price: 1500,
    seats: 4,
    features: ["chat"],
    car: "Skoda Octavia, синий",
  },
];

const RidesList = () => {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ближайшие поездки</h2>
          <p className="text-muted-foreground">Найдено {mockRides.length} поездок</p>
        </div>
        
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Фильтры
        </Button>
      </div>

      <div className="space-y-4">
        {mockRides.map((ride, index) => (
          <div 
            key={ride.id}
            style={{ animationDelay: `${index * 100}ms` }}
            className="animate-slide-up"
          >
            <RideCard ride={ride} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RidesList;
