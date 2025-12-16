import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient } from "@/lib/api-client";
import { setSentryUser, clearSentryUser } from "@/lib/sentry";
import { trackUserAction } from "@/lib/analytics";

// Типы пользователя (совместимые с Supabase для постепенной миграции)
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
  created_at?: string;
}

export interface Session {
  user: User;
  access_token: string;
  expires_at?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Загрузка сессии при монтировании
  useEffect(() => {
    const loadSession = async () => {
      const token = apiClient.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiClient.get<{ user: User; token: string }>('/api/auth/me');
        const sessionData: Session = {
          user: data.user,
          access_token: data.token,
        };
        setSession(sessionData);
        setUser(data.user);
        
        // Update Sentry user context
        if (data.user) {
          setSentryUser(
            data.user.id,
            data.user.email,
            data.user.user_metadata?.full_name
          );
        }
      } catch (error) {
        // Токен невалиден, очищаем
        apiClient.setToken(null);
        setSession(null);
        setUser(null);
        clearSentryUser();
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const data = await apiClient.post<{ user: User; token: string }>('/api/auth/signup', {
        email,
        password,
        full_name: fullName,
      });

      const sessionData: Session = {
        user: data.user,
        access_token: data.token,
      };

      apiClient.setToken(data.token);
      setSession(sessionData);
      setUser(data.user);

      // Track analytics
      trackUserAction.signUp("email");

      // Update Sentry user context
      if (data.user) {
        setSentryUser(
          data.user.id,
          data.user.email,
          data.user.user_metadata?.full_name
        );
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Sign up failed') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiClient.post<{ user: User; token: string }>('/api/auth/signin', {
        email,
        password,
      });

      const sessionData: Session = {
        user: data.user,
        access_token: data.token,
      };

      apiClient.setToken(data.token);
      setSession(sessionData);
      setUser(data.user);

      // Track analytics
      trackUserAction.signIn("email");

      // Update Sentry user context
      if (data.user) {
        setSentryUser(
          data.user.id,
          data.user.email,
          data.user.user_metadata?.full_name
        );
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Sign in failed') };
    }
  };

  const signOut = async () => {
    try {
      await apiClient.post('/api/auth/signout');
    } catch (error) {
      // Игнорируем ошибки при выходе
      console.error('Sign out error:', error);
    } finally {
      apiClient.setToken(null);
      setSession(null);
      setUser(null);
      
      // Track analytics
      trackUserAction.signOut();
      
      // Clear Sentry user context
      clearSentryUser();
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // TODO: Реализовать endpoint для сброса пароля
      await apiClient.post('/api/auth/reset-password', { email });
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Reset password failed') };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
