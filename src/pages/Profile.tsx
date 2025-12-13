import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useIsAdmin } from "@/hooks/useReports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Star, 
  Car, 
  Calendar,
  LogOut,
  Edit2,
  Check,
  X,
  Shield
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    bio: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: formData.full_name || null,
        phone: formData.phone || null,
        bio: formData.bio || null,
      });
      setEditing(false);
      toast({
        title: "Профиль обновлён",
        description: "Ваши данные успешно сохранены",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить профиль. Попробуйте еще раз.",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || isLoading) {
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
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              aria-label="Вернуться на главную"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Профиль</h1>
          </div>
          
          {!editing ? (
            <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
              <Edit2 className="w-5 h-5" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setEditing(false)}>
                <X className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSave}
                disabled={updateProfile.isPending}
              >
                <Check className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Avatar & Stats */}
        <div className="bg-card rounded-2xl p-6 shadow-card text-center">
          <div className="relative inline-block mb-4">
            <img 
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || user?.email}&background=0d9488&color=fff&size=128`}
              alt={profile?.full_name || "Профиль"}
              className="w-24 h-24 rounded-full object-cover border-4 border-primary-light mx-auto"
            />
            {profile?.is_verified && (
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-4 border-card">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-bold mb-1">
            {profile?.full_name || "Пользователь"}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">{user?.email}</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-muted">
              <Star className="w-5 h-5 text-warning mx-auto mb-1" />
              <p className="font-bold">{profile?.rating || 5}</p>
              <p className="text-xs text-muted-foreground">Рейтинг</p>
            </div>
            <div className="p-3 rounded-xl bg-muted">
              <Car className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="font-bold">{profile?.trips_count || 0}</p>
              <p className="text-xs text-muted-foreground">Поездок</p>
            </div>
            <div className="p-3 rounded-xl bg-muted">
              <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="font-bold text-sm">
                {profile?.created_at 
                  ? new Date(profile.created_at).getFullYear()
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">С нами с</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h3 className="font-bold text-lg">Личные данные</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Имя</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="pl-10"
                  disabled={!editing}
                  placeholder="Ваше имя"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Телефон</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                  disabled={!editing}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>О себе</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!editing}
                placeholder="Расскажите о себе..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          <button 
            className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors text-left"
            onClick={() => navigate("/my-rides")}
          >
            <Car className="w-5 h-5 text-primary" />
            <span className="flex-1 font-medium">Мои поездки</span>
          </button>
          <button 
            className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors text-left border-t border-border"
            onClick={() => navigate("/my-bookings")}
          >
            <Calendar className="w-5 h-5 text-primary" />
            <span className="flex-1 font-medium">Мои бронирования</span>
          </button>
          {isAdmin && (
            <button 
              className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors text-left border-t border-border"
              onClick={() => navigate("/admin")}
            >
              <Shield className="w-5 h-5 text-primary" />
              <span className="flex-1 font-medium">Админ панель</span>
            </button>
          )}
        </div>

        {/* Sign Out */}
        <Button 
          variant="outline" 
          className="w-full text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );
};

export default Profile;
