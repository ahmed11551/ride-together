import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import HeroSection from "@/components/home/HeroSection";
import PopularRoutes from "@/components/home/PopularRoutes";
import RidesList from "@/components/rides/RidesList";
import HowItWorks from "@/components/home/HowItWorks";
import DriverCTA from "@/components/home/DriverCTA";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>RideConnect — Поиск попутчиков и совместные поездки</title>
        <meta name="description" content="Найди попутчиков для поездки или предложи свой маршрут. Экономь до 75% на путешествиях с RideConnect — удобным сервисом совместных поездок." />
      </Helmet>
      
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <Header />
        
        <main className="page-transition">
          <HeroSection />
          <PopularRoutes />
          
          <div className="container">
            <RidesList />
          </div>
          
          <HowItWorks />
          <DriverCTA />
          
          {/* Footer */}
          <footer className="py-8 border-t border-border bg-muted/30">
            <div className="container text-center">
              <p className="text-sm text-muted-foreground">
                © 2024 RideConnect. Все права защищены.
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
