import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getUserFriendlyError, logError } from "@/lib/error-handler";

const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "Имя должно быть не менее 2 символов"),
});

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Пароль должен быть не менее 8 символов")
    .regex(/[A-Za-z]/, "Пароль должен содержать букву")
    .regex(/[0-9]/, "Пароль должен содержать цифру"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("reset_token");

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, confirmResetPassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !resetToken) {
      navigate("/");
    }
  }, [user, navigate, resetToken]);

  const validateForm = () => {
    try {
      if (resetToken) {
        resetPasswordSchema.parse({ password, confirmPassword });
      } else if (isLogin) {
        loginSchema.parse({ email, password });
      } else {
        signupSchema.parse({ email, password, fullName });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (resetToken) {
        const { error } = await confirmResetPassword(resetToken, password);
        if (error) {
          logError(error, "confirmResetPassword");
          const friendlyError = getUserFriendlyError(error);
          toast({ variant: "destructive", title: friendlyError.title, description: friendlyError.description });
        } else {
          setResetDone(true);
          toast({ title: "Пароль изменён", description: "Теперь вы можете войти с новым паролем" });
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          logError(error, "signIn");
          const friendlyError = getUserFriendlyError(error);
          toast({ variant: "destructive", title: friendlyError.title, description: friendlyError.description });
        } else {
          toast({ title: "Добро пожаловать!", description: "Вы успешно вошли в аккаунт" });
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          logError(error, "signUp");
          const friendlyError = getUserFriendlyError(error);
          toast({ variant: "destructive", title: friendlyError.title, description: friendlyError.description });
        } else {
          toast({ title: "Регистрация успешна!", description: "Добро пожаловать в Ride Together" });
          navigate("/");
        }
      }
    } catch (error) {
      logError(error, "handleSubmit");
      const friendlyError = getUserFriendlyError(error);
      toast({ variant: "destructive", title: friendlyError.title, description: friendlyError.description });
    } finally {
      setLoading(false);
    }
  };

  if (resetDone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <CheckCircle className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Пароль изменён</h1>
          <p className="text-muted-foreground">Войдите с новым паролем</p>
          <Button variant="hero" className="w-full" onClick={() => navigate("/auth")}>
            Войти
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {resetToken ? "Новый пароль" : isLogin ? "Вход в аккаунт" : "Регистрация"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {resetToken
                ? "Придумайте новый пароль для вашего аккаунта"
                : isLogin
                  ? "Войдите, чтобы найти попутчиков"
                  : "Создайте аккаунт и начните путешествовать"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!resetToken && !isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Имя</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Иван Иванов"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    autoComplete="name"
                  />
                </div>
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>
            )}

            {!resetToken && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">{resetToken ? "Новый пароль" : "Пароль"}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoComplete={resetToken ? "new-password" : isLogin ? "current-password" : "new-password"}
                />
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {resetToken && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
            )}

            {isLogin && !resetToken && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Забыли пароль?
                </Link>
              </div>
            )}

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading} loading={loading}>
              {resetToken ? "Сохранить пароль" : isLogin ? "Войти" : "Зарегистрироваться"}
            </Button>
          </form>

          {!resetToken && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Нет аккаунта? Зарегистрируйтесь" : "Уже есть аккаунт? Войдите"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
