import { LucideIcon } from 'lucide-react';
import { memo } from 'react';

interface PageHeroProps {
  title: string;
  subtitle: string;
  badgeText: string;
  badgeIcon: LucideIcon;
  backgroundImage: string;
  gradientOverlay?: string;
}

export const PageHero = memo(({ 
  title, 
  subtitle, 
  badgeText, 
  badgeIcon: Icon, 
  backgroundImage,
  gradientOverlay = 'bg-gradient-to-b from-black/40 via-black/50 to-black/50'
}: PageHeroProps) => {
  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className={`absolute inset-0 ${gradientOverlay}`}></div>
      </div>
      
      <div className="container-custom section-padding relative z-10 px-4">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-white/20 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6 backdrop-blur-sm">
            <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">{badgeText}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-fredoka text-white mb-4 sm:mb-6 px-2">
            {title}
          </h1>
          <p className="text-base sm:text-lg text-white/90 px-4">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full h-12 sm:h-16 lg:h-20 text-background">
          <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
        </svg>
      </div>
    </section>
  );
});

PageHero.displayName = 'PageHero';
