import { MapPin, Calendar, Users, ArrowRight, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SearchForm = () => {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  const swapLocations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);
    params.set("passengers", passengers.toString());
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="relative bg-card rounded-2xl shadow-card p-6 space-y-4">
      <div className="relative space-y-3">
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
          <input
            type="text"
            placeholder="Откуда"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card outline-none transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <button 
          onClick={swapLocations}
          className="absolute right-4 top-[3.25rem] z-10 w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
        >
          <ArrowDownUp className="w-4 h-4" />
        </button>

        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
          <input
            type="text"
            placeholder="Куда"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card outline-none transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card outline-none transition-all text-foreground"
          />
        </div>

        <div className="relative">
          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <select
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card outline-none transition-all text-foreground appearance-none cursor-pointer"
          >
            {[1, 2, 3, 4].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? "пассажир" : num < 5 ? "пассажира" : "пассажиров"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button variant="hero" size="lg" className="w-full" onClick={handleSearch}>
        Найти поездку
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default SearchForm;
