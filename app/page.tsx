import { HeroSection } from "@/components/HeroSection";
import { ProblemaSection } from "@/components/ProblemaSection";
import { EstandarizaSection } from "@/components/EstandarizaSection";
import { EjemploSection } from "@/components/EjemploSection";
import { EstadoActualSection } from "@/components/EstadoActualSection";
import { RedSection } from "@/components/RedSection";
import { AudienciasSection } from "@/components/AudienciasSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="max-w-content mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-24">
      <HeroSection />
      <ProblemaSection />
      <EstandarizaSection />
      <EjemploSection />
      <EstadoActualSection />
      <RedSection />
      <AudienciasSection />
      <Footer />
    </div>
  );
}
