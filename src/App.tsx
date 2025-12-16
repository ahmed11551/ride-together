// КРИТИЧНО: React должен быть импортирован первым
import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { TelegramProvider } from "@/contexts/TelegramContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Analytics } from "@/components/Analytics";
import { logError } from "@/lib/error-handler";
import { RideCardSkeleton } from "@/components/ui/skeleton-loaders";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const CreateRide = lazy(() => import("./pages/CreateRide"));
const RideDetails = lazy(() => import("./pages/RideDetails"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const MyRides = lazy(() => import("./pages/MyRides"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md px-4">
      <RideCardSkeleton />
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      // Кэширование запросов для лучшей производительности
      staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
      gcTime: 10 * 60 * 1000, // 10 минут - данные остаются в кэше (cacheTime переименован в gcTime в v5)
      // Включаем структурное разделение для лучшего кэширования
      structuralSharing: true,
      // Network mode для офлайн поддержки
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
      onError: (error) => {
        logError(error, "React Query Mutation");
      },
    },
  },
});

// Настройка кэширования для конкретных типов запросов
queryClient.setQueryDefaults(["rides"], {
  staleTime: 2 * 60 * 1000, // 2 минуты для списков поездок
  gcTime: 5 * 60 * 1000, // 5 минут в кэше
  // Предзагрузка следующей страницы
  placeholderData: (previousData) => previousData,
});

queryClient.setQueryDefaults(["ride"], {
  staleTime: 1 * 60 * 1000, // 1 минута для деталей поездки
  gcTime: 3 * 60 * 1000, // 3 минуты в кэше
});

queryClient.setQueryDefaults(["profile"], {
  staleTime: 10 * 60 * 1000, // 10 минут для профиля
  gcTime: 30 * 60 * 1000, // 30 минут в кэше
});

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <TelegramProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Analytics />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/create-ride" element={<CreateRide />} />
                    <Route path="/ride/:id" element={<RideDetails />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/my-rides" element={<MyRides />} />
                    <Route path="/my-bookings" element={<MyBookings />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </TelegramProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
