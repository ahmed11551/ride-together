import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getUserFriendlyError, logError } from "@/lib/error-handler";

const emailSchema = z.object({
  email: z.string().email("Введите корректный email"),
});

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      emailSchema.parse({ email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        logError(error, "resetPassword");
        const friendlyError = getUserFriendlyError(error);
        toast({
          variant: "destructive",
          title: friendlyError.title,
          description: friendlyError.description,
        });
        setErrors({ email: friendlyError.description });
      } else {
        setIsSent(true);
        toast({
          title: "Письмо отправлено",
          description: "Проверьте вашу почту для восстановления пароля",
        });
      }
    } catch (error) {
      logError(error, "ForgotPassword submit");
      const friendlyError = getUserFriendlyError(error);
      toast({
        variant: "destructive",
        title: friendlyError.title,
        description: friendlyError.description,
      });
    } finally {
      setLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-success-light flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Письмо отправлено</h1>
              <p className="text-muted-foreground mt-2">
                Мы отправили инструкции по восстановлению пароля на {email}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Проверьте папку "Спам", если письмо не пришло в течение нескольких минут.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Вернуться к входу
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Восстановление пароля</h1>
          <p className="text-muted-foreground">
            Введите email, и мы отправим вам инструкции по восстановлению пароля
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? "border-destructive pl-10" : "pl-10"}
                disabled={loading}
                required
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Отправка..." : "Отправить инструкции"}
          </Button>
        </form>

        <div className="text-center">
          <Link
            to="/auth"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться к входу
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

