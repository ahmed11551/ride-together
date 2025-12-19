import { useNavigate } from "react-router-dom";
import RideCard from "@/components/rides/RideCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * Демо-поездки для показа, когда БД пуста
 * Помогает пользователям понять, как выглядят поездки
 */
const DEMO_RIDES = [
  {
    id: 'demo-1',
    driver: {
      name: 'Алексей П.',
      avatar: 'https://ui-avatars.com/api/?name=Алексей+П&background=0d9488&color=fff',
      rating: 4.8,
      trips: 127,
      verified: true,
    },
    from: 'Москва, м. ВДНХ',
    to: 'Санкт-Петербург, м. Московская',
    fromCity: 'Москва',
    toCity: 'Санкт-Петербург',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Завтра
    time: '08:00',
    duration: '7 ч',
    price: 1500,
    seats: 2,
    features: {
      noSmoking: true,
      music: true,
      pets: false,
    },
  },
  {
    id: 'demo-2',
    driver: {
      name: 'Мария К.',
      avatar: 'https://ui-avatars.com/api/?name=Мария+К&background=8b5cf6&color=fff',
      rating: 4.9,
      trips: 89,
      verified: true,
    },
    from: 'Москва, м. Курская',
    to: 'Казань, центр',
    fromCity: 'Москва',
    toCity: 'Казань',
    date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // Послезавтра
    time: '10:30',
    duration: '10 ч',
    price: 2000,
    seats: 3,
    features: {
      noSmoking: true,
      music: true,
      pets: true,
    },
  },
  {
    id: 'demo-3',
    driver: {
      name: 'Дмитрий С.',
      avatar: 'https://ui-avatars.com/api/?name=Дмитрий+С&background=ec4899&color=fff',
      rating: 4.7,
      trips: 203,
      verified: true,
    },
    from: 'Санкт-Петербург, м. Площадь Восстания',
    to: 'Москва, м. Комсомольская',
    fromCity: 'Санкт-Петербург',
    toCity: 'Москва',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '14:00',
    duration: '8 ч',
    price: 1800,
    seats: 1,
    features: {
      noSmoking: true,
      music: false,
      pets: false,
    },
  },
];

interface DemoRidesProps {
  onRideClick?: () => void;
}

export const DemoRides = ({ onRideClick }: DemoRidesProps) => {
  const navigate = useNavigate();

  const handleRideClick = () => {
    if (onRideClick) {
      onRideClick();
    } else {
      navigate('/create-ride');
    }
  };

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Примеры поездок</h2>
            <p className="text-muted-foreground text-sm">
              Так выглядят поездки в Ride Together
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {DEMO_RIDES.map((ride, index) => (
          <div 
            key={ride.id}
            style={{ animationDelay: `${index * 80}ms` }}
            className="animate-slide-up opacity-60"
          >
            <RideCard 
              ride={ride}
              onSelect={handleRideClick}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-1">
              Это демо-режим
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Показываем примеры поездок, чтобы вы поняли, как работает сервис. 
              Создайте свою первую поездку, чтобы начать!
            </p>
            <Button 
              onClick={() => navigate('/create-ride')}
              className="w-full sm:w-auto"
            >
              Создать поездку
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

