import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import HeroSection from "@/components/home/HeroSection";
import PopularRoutes from "@/components/home/PopularRoutes";
import RidesList from "@/components/rides/RidesList";
import { LazyRidesMap } from "@/components/map/LazyRidesMap";
import { DemoChat } from "@/components/home/DemoChat";
import HowItWorks from "@/components/home/HowItWorks";
import DriverCTA from "@/components/home/DriverCTA";
import { SubscribePrompt } from "@/components/telegram/SubscribePrompt";
import { Helmet } from "react-helmet-async";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useRecentRides } from "@/hooks/useRides";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map as MapIcon, List, MessageCircle } from "lucide-react";

const Index = () => {
  // Автоматическая авторизация через Telegram, если приложение запущено в Telegram
  useTelegramAuth();
  const { data: rides } = useRecentRides();

  return (
    <>
      <Helmet>
        <title>RideConnect — Поиск попутчиков и совместные поездки</title>
        <meta name="description" content="Найди попутчиков для поездки или предложи свой маршрут. Экономь до 75% на путешествиях с RideConnect — удобным сервисом совместных поездок." />
      </Helmet>
      
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Перейти к основному содержимому
      </a>
      
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <Header />
        
        <main id="main-content" className="page-transition" role="main">
          <HeroSection />
          <PopularRoutes />
          
          <div className="container">
            {/* Telegram Subscribe Prompt */}
            <div className="mb-6">
              <SubscribePrompt showInWebApp={true} />
            </div>

            {/* Ближайшие поездки - всегда показываем, даже если пусто */}
            {rides && rides.length > 0 ? (
              <Tabs defaultValue="list" className="w-full mb-8">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="list" aria-label="Показать список поездок">
                    <List className="w-4 h-4 mr-2" />
                    Список
                  </TabsTrigger>
                  <TabsTrigger value="map" aria-label="Показать поездки на карте">
                    <MapIcon className="w-4 h-4 mr-2" />
                    Карта
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="list">
                  <RidesList />
                </TabsContent>

                <TabsContent value="map" className="h-[500px] md:h-[600px]">
                  <LazyRidesMap rides={rides} height="500px" />
                </TabsContent>
              </Tabs>
            ) : (
              <RidesList />
            )}
          </div>
          
          {/* Demo Chat Section */}
          <div className="container py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-primary" />
                Общение в поездке
              </h2>
              <p className="text-muted-foreground">
                Удобный чат для связи с водителем и пассажирами
              </p>
            </div>
            <DemoChat />
          </div>

          <HowItWorks />
          <DriverCTA />
          
          {/* Footer */}
          <footer className="py-8 border-t border-border bg-muted/30">
            <div className="container text-center">
              <p className="text-sm text-muted-foreground">
                © 2025 RideConnect. Все права защищены. -Sebiev-
              </p>
            </div>
          </footer>
        </main>

        <BottomNav />
      </div>
    </>
  );
};

export default Index;
