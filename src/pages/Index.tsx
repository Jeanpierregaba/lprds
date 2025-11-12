import Header from '@/components/Header';
import Hero from '@/components/Hero';
import AboutSection from '@/components/AboutSection';
import ServicesSection from '@/components/ServicesSection';
import WhyChooseUsSection from '@/components/WhyChooseUsSection';
import ProcessSection from '@/components/ProcessSection';
import MiniGallerySection from '@/components/MiniGallerySection';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';
import CtaSection from '@/components/CtaSection';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <AboutSection />
        <ServicesSection />
        <WhyChooseUsSection />
        <ProcessSection />
        <CtaSection />
        {/* <MiniGallerySection /> */}
        {/* <Testimonials /> */}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
