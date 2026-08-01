import { HeroSection } from "@/components/HeroSection";
import { QueEsSection } from "@/components/QueEsSection";
import { ProblemaSection } from "@/components/ProblemaSection";
import { ObjetosSection } from "@/components/ObjetosSection";
import { AnatomiaSection } from "@/components/AnatomiaSection";
import { ModeloSection } from "@/components/ModeloSection";
import { PruebaSection } from "@/components/PruebaSection";
import { CicloSection } from "@/components/CicloSection";
import { PrincipiosSection } from "@/components/PrincipiosSection";
import { AgentesSection } from "@/components/AgentesSection";
import { EstadoActualSection } from "@/components/EstadoActualSection";
import { ParticiparSection } from "@/components/ParticiparSection";
import { Footer } from "@/components/Footer";
import { FadeIn } from "@/components/FadeIn";

export default function Home() {
  return (
    <div className="max-w-content mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-24">
      <HeroSection />
      <FadeIn>
        <QueEsSection />
      </FadeIn>
      <FadeIn>
        <ProblemaSection />
      </FadeIn>
      <FadeIn>
        <ObjetosSection />
      </FadeIn>
      <FadeIn>
        <AnatomiaSection />
      </FadeIn>
      <FadeIn>
        <ModeloSection />
      </FadeIn>
      <FadeIn>
        <PruebaSection />
      </FadeIn>
      <FadeIn>
        <CicloSection />
      </FadeIn>
      <FadeIn>
        <PrincipiosSection />
      </FadeIn>
      <FadeIn>
        <AgentesSection />
      </FadeIn>
      <FadeIn>
        <EstadoActualSection />
      </FadeIn>
      <FadeIn>
        <ParticiparSection />
      </FadeIn>
      <FadeIn>
        <Footer />
      </FadeIn>
    </div>
  );
}
