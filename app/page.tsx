import { HeroSection } from "@/components/HeroSection";
import { ProblemaSection } from "@/components/ProblemaSection";
import { PorQueSection } from "@/components/PorQueSection";
import { FueraDeAlcanceSection } from "@/components/FueraDeAlcanceSection";
import { EstandarizaSection } from "@/components/EstandarizaSection";
import { EjemploSection } from "@/components/EjemploSection";
import { EstadoActualSection } from "@/components/EstadoActualSection";
import { RedSection } from "@/components/RedSection";
import { AudienciasSection } from "@/components/AudienciasSection";
import { Footer } from "@/components/Footer";

// Orden de la portada: el rol y el porqué antes del modelo de datos.
// 00 declaración de rol (hero) · 01 el problema · 02 por qué un protocolo
// 03 fuera de alcance · 04 el modelo · 05 un ejemplo
// 06 estado y honestidad epistémica (EstadoActual + Red) · 07 siguiente paso
export default function Home() {
  return (
    <div className="max-w-content mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-24">
      <HeroSection />
      <ProblemaSection />
      <PorQueSection />
      <FueraDeAlcanceSection />
      <EstandarizaSection />
      <EjemploSection />
      <EstadoActualSection />
      <RedSection />
      <AudienciasSection />
      <Footer />
    </div>
  );
}
