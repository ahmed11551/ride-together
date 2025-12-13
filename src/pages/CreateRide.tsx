import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateRide } from "@/hooks/useRides";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError, logError } from "@/lib/error-handler";
import { createRideSchema, type CreateRideFormData } from "@/lib/validation";
import { MapComponent, type Location } from "@/components/map/MapComponent";
import { reverseGeocode } from "@/lib/geocoding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Wallet,
  Cigarette,
  Dog,
  Music
} from "lucide-react";

const CreateRide = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const createRide = useCreateRide();
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateRideFormData>({
    from_city: "",
    from_address: "",
    to_city: "",
    to_address: "",
    departure_date: "",
    departure_time: "08:00",
    estimated_duration: "",
    price: "",
    seats_total: "4",
    seats_available: "4",
    allow_smoking: false,
    allow_pets: false,
    allow_music: true,
    notes: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [mapTab, setMapTab] = useState<'from' | 'to'>('from');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    if (field === "seats_total") {
      setFormData((prev) => ({ ...prev, seats_available: value as string }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form
    const validationResult = createRideSchema.safeParse(formData);
    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      
      toast({
        variant: "destructive",
        title: "Ошибка валидации",
        description: "Проверьте правильность заполнения полей",
      });
      return;
    }

    try {
      await createRide.mutateAsync({
        from_city: formData.from_city,
        from_address: formData.from_address || formData.from_city,
        to_city: formData.to_city,
        to_address: formData.to_address || formData.to_city,
        departure_date: formData.departure_date,
        departure_time: formData.departure_time || "08:00",
        estimated_duration: formData.estimated_duration || null,
        price: parseInt(formData.price),
        seats_total: parseInt(formData.seats_total),
        seats_available: parseInt(formData.seats_available),
        allow_smoking: formData.allow_smoking,
        allow_pets: formData.allow_pets,
        allow_music: formData.allow_music,
        notes: formData.notes || null,
      });

      toast({
        title: "Успешно!",
        description: "Поездка опубликована",
      });
      navigate("/my-rides");
    } catch (error) {
      logError(error, "createRide");
      const friendlyError = getUserFriendlyError(error);
      toast({
        variant: "destructive",
        title: friendlyError.title,
        description: friendlyError.description,
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Создать поездку</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="container py-6 space-y-6">
        {/* Route */}
        <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="font-bold text-lg">Маршрут</h2>
          
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">Форма</TabsTrigger>
              <TabsTrigger value="map">Карта</TabsTrigger>
            </TabsList>
            
            <TabsContent value="form" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
              <Label>Откуда *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                <Input
                  placeholder="Город отправления"
                  value={formData.from_city}
                  onChange={(e) => {
                    handleChange("from_city", e.target.value);
                    if (errors.from_city) setErrors(prev => ({ ...prev, from_city: "" }));
                  }}
                  className={`pl-10 ${errors.from_city ? "border-destructive" : ""}`}
                />
              </div>
              {errors.from_city && (
                <p className="text-sm text-destructive">{errors.from_city}</p>
              )}
              <Input
                placeholder="Точный адрес (опционально)"
                value={formData.from_address}
                onChange={(e) => handleChange("from_address", e.target.value)}
              />
              {fromLocation && (
                <p className="text-xs text-muted-foreground">
                  📍 Выбрано на карте: {fromLocation.address || `${fromLocation.lat.toFixed(4)}, ${fromLocation.lng.toFixed(4)}`}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Куда *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <Input
                  placeholder="Город прибытия"
                  value={formData.to_city}
                  onChange={(e) => {
                    handleChange("to_city", e.target.value);
                    if (errors.to_city) setErrors(prev => ({ ...prev, to_city: "" }));
                  }}
                  className={`pl-10 ${errors.to_city ? "border-destructive" : ""}`}
                />
              </div>
              {errors.to_city && (
                <p className="text-sm text-destructive">{errors.to_city}</p>
              )}
              <Input
                placeholder="Точный адрес (опционально)"
                value={formData.to_address}
                onChange={(e) => handleChange("to_address", e.target.value)}
              />
              {toLocation && (
                <p className="text-xs text-muted-foreground">
                  📍 Выбрано на карте: {toLocation.address || `${toLocation.lat.toFixed(4)}, ${toLocation.lng.toFixed(4)}`}
                </p>
              )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="map" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Выберите точку на карте</Label>
                <Tabs value={mapTab} onValueChange={(v) => setMapTab(v as 'from' | 'to')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="from">Откуда</TabsTrigger>
                    <TabsTrigger value="to">Куда</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <MapComponent
                mode="select"
                initialLocation={mapTab === 'from' ? fromLocation || undefined : toLocation || undefined}
                onLocationSelect={async (location) => {
                  if (mapTab === 'from') {
                    setFromLocation(location);
                    // Попытка получить адрес через reverse geocoding
                    const address = await reverseGeocode(location.lat, location.lng);
                    if (address) {
                      const locationWithAddress = { ...location, address };
                      setFromLocation(locationWithAddress);
                      const city = address.split(',')[0];
                      setFormData(prev => ({
                        ...prev,
                        from_city: city,
                        from_address: address,
                      }));
                    }
                  } else {
                    setToLocation(location);
                    const address = await reverseGeocode(location.lat, location.lng);
                    if (address) {
                      const locationWithAddress = { ...location, address };
                      setToLocation(locationWithAddress);
                      const city = address.split(',')[0];
                      setFormData(prev => ({
                        ...prev,
                        to_city: city,
                        to_address: address,
                      }));
                    }
                  }
                }}
                height="400px"
              />
              
              <p className="text-sm text-muted-foreground">
                💡 Кликните на карте, чтобы выбрать точку {mapTab === 'from' ? 'отправления' : 'прибытия'}
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Date & Time */}
        <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="font-bold text-lg">Дата и время</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Дата *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="date"
                  value={formData.departure_date}
                  onChange={(e) => {
                    handleChange("departure_date", e.target.value);
                    if (errors.departure_date) setErrors(prev => ({ ...prev, departure_date: "" }));
                  }}
                  className={`pl-10 ${errors.departure_date ? "border-destructive" : ""}`}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              {errors.departure_date && (
                <p className="text-sm text-destructive">{errors.departure_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Время</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="time"
                  value={formData.departure_time}
                  onChange={(e) => handleChange("departure_time", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Примерное время в пути</Label>
            <Input
              placeholder="Например: 7 часов"
              value={formData.estimated_duration}
              onChange={(e) => handleChange("estimated_duration", e.target.value)}
            />
          </div>
        </div>

        {/* Price & Seats */}
        <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="font-bold text-lg">Цена и места</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Цена за место *</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="1500"
                  value={formData.price}
                  onChange={(e) => {
                    handleChange("price", e.target.value);
                    if (errors.price) setErrors(prev => ({ ...prev, price: "" }));
                  }}
                  className={`pl-10 ${errors.price ? "border-destructive" : ""}`}
                  min="1"
                  max="100000"
                />
              </div>
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Свободных мест</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <select
                  value={formData.seats_total}
                  onChange={(e) => handleChange("seats_total", e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-muted border-2 border-transparent focus:border-primary focus:bg-card outline-none transition-all"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="font-bold text-lg">Правила поездки</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Cigarette className="w-5 h-5 text-muted-foreground" />
                </div>
                <span>Можно курить</span>
              </div>
              <Switch
                checked={formData.allow_smoking}
                onCheckedChange={(checked) => handleChange("allow_smoking", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Dog className="w-5 h-5 text-muted-foreground" />
                </div>
                <span>Можно с животными</span>
              </div>
              <Switch
                checked={formData.allow_pets}
                onCheckedChange={(checked) => handleChange("allow_pets", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Music className="w-5 h-5 text-muted-foreground" />
                </div>
                <span>Музыка в дороге</span>
              </div>
              <Switch
                checked={formData.allow_music}
                onCheckedChange={(checked) => handleChange("allow_music", checked)}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="font-bold text-lg">Дополнительно</h2>
          <Textarea
            placeholder="Дополнительная информация о поездке..."
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={4}
          />
        </div>

        {/* Submit */}
        <Button 
          type="submit" 
          variant="hero" 
          size="xl" 
          className="w-full"
          disabled={createRide.isPending}
        >
          {createRide.isPending ? "Создание..." : "Опубликовать поездку"}
        </Button>
      </form>
    </div>
  );
};

export default CreateRide;
