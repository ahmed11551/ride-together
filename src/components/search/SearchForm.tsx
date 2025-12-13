import { MapPin, Calendar, Users, ArrowRight, ArrowDownUp, Search as SearchIcon } from "lucide-react";
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
    <div className="relative bg-card rounded-2xl shadow-lg border border-border/50 p-5 md:p-6 space-y-4">
      {/* From/To Fields */}
      <div className="relative space-y-3">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-success-light flex items-center justify-center">
            <MapPin className="w-4 h-4 text-success" />
          </div>
          <input
            type="text"
            placeholder="Откуда едем?"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full h-13 pl-14 pr-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-card outline-none transition-all text-foreground placeholder:text-muted-foreground font-medium"
            aria-label="Город отправления"
            autoComplete="off"
          />
        </div>

        <button 
          onClick={swapLocations}
          className="absolute right-4 top-[3.5rem] z-10 w-9 h-9 rounded-full bg-card border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary hover:scale-110 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Поменять местами города отправления и прибытия"
        >
          <ArrowDownUp className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-warning-light flex items-center justify-center">
            <MapPin className="w-4 h-4 text-secondary" />
          </div>
          <input
            type="text"
            placeholder="Куда едем?"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full h-13 pl-14 pr-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-card outline-none transition-all text-foreground placeholder:text-muted-foreground font-medium"
            aria-label="Город прибытия"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Date and Passengers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full h-13 pl-14 pr-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-card outline-none transition-all text-foreground cursor-pointer font-medium"
          />
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <select
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="w-full h-13 pl-14 pr-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-card outline-none transition-all text-foreground appearance-none cursor-pointer font-medium"
          >
            {[1, 2, 3, 4].map((num) => (
              <option key={num} value={num}>
                {num} пассажир{num > 1 ? (num < 5 ? 'а' : 'ов') : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Button */}
      <Button 
        variant="hero" 
        size="lg" 
        className="w-full" 
        onClick={handleSearch}
        aria-label="Найти поездки по заданным параметрам"
      >
        <SearchIcon className="w-5 h-5" aria-hidden="true" />
        Найти поездку
      </Button>
    </div>
  );
};

export default SearchForm;
