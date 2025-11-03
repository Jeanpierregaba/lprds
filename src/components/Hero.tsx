import { Heart, Sparkles, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg-v.jpg';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const Hero = () => {
  const [ref, isVisible] = useScrollAnimation();
  
  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img 
          src={heroBg} 
          alt="Children and educators in a loving daycare environment"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
      </div>
      
      <div className="container-custom section-padding relative z-10">
        <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

          <span className="text-accent uppercase font-bold text-lg mb-4 border border-accent rounded-full px-4 py-2 bg-primary-foreground/90 ">👶Crèche – 👦Garderie – 📚 Maternelle
          </span>
          {/* Main heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-fredoka text-white mb-6 leading-tight animate-fade-in-up drop-shadow-lg mt-6" style={{animationDelay: '0.2s'}}>
            Où chaque enfant <span className="text-secondary">explore</span> et <span className="text-secondary">rayonne</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up drop-shadow-md px-4" style={{animationDelay: '0.4s'}}>
            Votre enfant mérite un départ réussi. Une structure où il grandit,
            apprend et s'épanouit en toute sécurité
          </p>

          {/* CTA Button */}
          <div className="flex justify-center animate-fade-in-up px-4" style={{animationDelay: '0.6s'}}>
            <Button 
              className="btn-primary text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              onClick={() => (window.location.href = '/contact')}
            
            >
              Réserver une visite
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom wave 
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440" className="w-full h-20 text-background">
          <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
        </svg>
      </div>*/}
    </section>
  );
};

export default Hero;