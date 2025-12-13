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
import { LazyMapComponent } from "@/components/map/LazyMapComponent";
import type { Location } from "@/components/map/MapComponent";
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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            aria-label="Вернуться назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Создать поездку</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="container py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-6">
        {/* Route */}
        <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card space-y-4">
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
                      placeholder="Город отправления (например: Москва, м. Бауманская)"
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
                      Выбрано на карте: {fromLocation.address || 'Адрес не определен - введите вручную'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Куда *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                    <Input
                      placeholder="Город прибытия (например: Санкт-Петербург, м. Московская)"
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
                      Выбрано на карте: {toLocation.address || 'Адрес не определен - введите вручную'}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="map" className="mt-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Выберите точку на карте</Label>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Кликните на карте</span>
                  </div>
                </div>
                <Tabs value={mapTab} onValueChange={(v) => setMapTab(v as 'from' | 'to')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="from" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                      <span className="hidden sm:inline">Откуда</span>
                      <span className="sm:hidden">От</span>
                    </TabsTrigger>
                    <TabsTrigger value="to" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" />
                      <span className="hidden sm:inline">Куда</span>
                      <span className="sm:hidden">До</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                {(mapTab === 'from' ? fromLocation : toLocation) && (
                  <div className="p-2 sm:p-3 bg-success-light rounded-lg border border-success/20">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-success shrink-0" />
                      <span className="font-medium text-success break-words">
                        {(mapTab === 'from' ? fromLocation : toLocation)?.address || 
                         'Адрес не определен - введите вручную'}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      Если адрес не определился автоматически, введите его вручную в поле "Город"
                    </p>
                  </div>
                )}
              </div>
              
              <LazyMapComponent
                mode="select"
                initialLocation={mapTab === 'from' ? fromLocation || undefined : toLocation || undefined}
                onLocationSelect={async (location) => {
                      try {
                        if (mapTab === 'from') {
                          setFromLocation(location);
                          // Попытка получить адрес через reverse geocoding
                          const parsedAddress = await reverseGeocode(location.lat, location.lng);
                          if (parsedAddress) {
                            const locationWithAddress = { 
                              ...location, 
                              address: parsedAddress.shortAddress 
                            };
                            setFromLocation(locationWithAddress);
                            
                            // Заполняем форму понятными данными
                            setFormData(prev => ({
                              ...prev,
                              from_city: parsedAddress.city || parsedAddress.shortAddress,
                              from_address: parsedAddress.shortAddress,
                            }));
                          } else {
                            // Если геокодирование не удалось, просим ввести вручную
                            setFormData(prev => ({
                              ...prev,
                              from_city: '',
                              from_address: '',
                            }));
                            toast({
                              title: 'Адрес не определен',
                              description: 'Пожалуйста, введите адрес вручную в поле "Город"',
                              variant: 'default',
                            });
                          }
                        } else {
                          setToLocation(location);
                          const parsedAddress = await reverseGeocode(location.lat, location.lng);
                          if (parsedAddress) {
                            const locationWithAddress = { 
                              ...location, 
                              address: parsedAddress.shortAddress 
                            };
                            setToLocation(locationWithAddress);
                            
                            // Заполняем форму понятными данными
                            setFormData(prev => ({
                              ...prev,
                              to_city: parsedAddress.city || parsedAddress.shortAddress,
                              to_address: parsedAddress.shortAddress,
                            }));
                          } else {
                            // Если геокодирование не удалось, просим ввести вручную
                            setFormData(prev => ({
                              ...prev,
                              to_city: '',
                              to_address: '',
                            }));
                            toast({
                              title: 'Адрес не определен',
                              description: 'Пожалуйста, введите адрес вручную в поле "Город"',
                              variant: 'default',
                            });
                          }
                        }
                      } catch (error) {
                        console.error('Ошибка обработки выбранной локации:', error);
                        toast({
                          title: 'Ошибка определения адреса',
                          description: 'Пожалуйста, введите адрес вручную',
                          variant: 'destructive',
                        });
                      }
                    }}
                    height="300px"
                    className="sm:h-[400px]"
                  />
              
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">Подсказка:</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Как выбрать точку на карте:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Кликните на карте, чтобы выбрать точку {mapTab === 'from' ? 'отправления' : 'прибытия'}</li>
                      <li>Используйте кнопку "Моё местоположение" для автоматического определения</li>
                      <li>Адрес определится автоматически (город, метро, улица)</li>
                      <li>Если адрес не определился, введите его вручную в поле "Город" (например: "Москва, м. Бауманская")</li>
                      <li>Детали можно обсудить в чате с пассажирами</li>
                    </ul>
                  </div>
                </div>
              </div>
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
        <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card space-y-4">
          <h2 className="font-bold text-lg">Цена и места</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card space-y-4">
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
        <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card space-y-4">
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
          className="w-full min-h-[48px] sm:min-h-[56px]"
          disabled={createRide.isPending}
          loading={createRide.isPending}
          aria-label="Опубликовать поездку"
        >
          <span className="text-base sm:text-lg">Опубликовать поездку</span>
        </Button>
      </form>
    </div>
  );
};

export default CreateRide;
