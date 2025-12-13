import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { TelegramProvider } from "@/contexts/TelegramContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { logError } from "@/lib/error-handler";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreateRide from "./pages/CreateRide";
import RideDetails from "./pages/RideDetails";
import SearchResults from "./pages/SearchResults";
import MyRides from "./pages/MyRides";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        logError(error, "React Query Mutation");
      },
    },
  },
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
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/create-ride" element={<CreateRide />} />
                  <Route path="/ride/:id" element={<RideDetails />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/my-rides" element={<MyRides />} />
                  <Route path="/my-bookings" element={<MyBookings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </TelegramProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
