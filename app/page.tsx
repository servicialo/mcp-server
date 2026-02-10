import { HeroSection } from "@/components/HeroSection";
import { QueEsSection } from "@/components/QueEsSection";
import { OrigenSection } from "@/components/OrigenSection";
import { AnatomiaSection } from "@/components/AnatomiaSection";
import { CicloSection } from "@/components/CicloSection";
import { PrincipiosSection } from "@/components/PrincipiosSection";
import { EstandarSection } from "@/components/EstandarSection";
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
        <OrigenSection />
      </FadeIn>
      <FadeIn>
        <AnatomiaSection />
      </FadeIn>
      <FadeIn>
        <CicloSection />
      </FadeIn>
      <FadeIn>
        <PrincipiosSection />
      </FadeIn>
      <FadeIn>
        <EstandarSection />
      </FadeIn>
      <FadeIn>
        <Footer />
      </FadeIn>
    </div>
  );
}
