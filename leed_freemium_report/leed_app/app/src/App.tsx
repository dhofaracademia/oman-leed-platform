import { useRef } from 'react';
import { Navbar } from '@/sections/Navbar';
import { Hero } from '@/sections/Hero';
import { AnalysisDashboard } from '@/sections/AnalysisDashboard';
import { Features } from '@/sections/Features';
import { Pricing } from '@/sections/Pricing';
import { About } from '@/sections/About';
import { Footer } from '@/sections/Footer';

function App() {
  const heroRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (section: string) => {
    const sectionMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      hero: heroRef,
      analysis: analysisRef,
      features: featuresRef,
      pricing: pricingRef,
      about: aboutRef,
    };

    const targetRef = sectionMap[section];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar onNavigate={handleNavigate} />
      
      <div ref={heroRef}>
        <Hero onNavigate={handleNavigate} />
      </div>
      
      <div ref={analysisRef}>
        <AnalysisDashboard />
      </div>
      
      <div ref={featuresRef}>
        <Features />
      </div>

      <div ref={pricingRef}>
        <Pricing />
      </div>
      
      <div ref={aboutRef}>
        <About />
      </div>
      
      <Footer />
    </div>
  );
}

export default App;
