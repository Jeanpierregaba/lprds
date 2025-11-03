import { Sparkles, Star, Heart, Users, Award, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import aboutImage1 from '@/assets/about-img.jpg';
import aboutImage2 from '@/assets/about-img-3.jpg';
import aboutImage3 from '@/assets/about-img-2.jpg';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const AboutSection = () => {
  const [ref, isVisible] = useScrollAnimation();
  
  return (
    <>
      {/* Top wave divider */}
      <div className="w-full">
        <svg viewBox="0 0 1440 120" className="w-full h-16 text-background">
          <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
      </div>

      <section ref={ref} className="section-padding bg-background relative overflow-hidden">

        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Contenu texte */}
            <div className={`space-y-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="space-y-6">
                <div className="inline-block">
                  <span className="text-lg font-bold text-secondary uppercase tracking-wider">À PROPOS DE NOUS</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-fredoka text-primary leading-tight">
                  Pourquoi Les Petits Rayons de Soleil ?
                </h2>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Chez Les Petits Rayons de Soleil, nous offrons un environnement sûr, 
                  bienveillant et joyeux où les enfants s'épanouissent. Notre équipe 
                  dévouée est passionnée par l'éveil de l'amour de l'apprentissage et 
                  de la curiosité chez chaque enfant.
                </p>
              </div>
              
              {/* Statistiques modernes - Responsive */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="bg-secondary rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="text-3xl sm:text-4xl font-fredoka text-primary-foreground">3+</div>
                    <div className="text-xs sm:text-sm text-primary-foreground">
                      Années d'expérience prouvée
                      <br />
                      dans la garde d'enfants.
                    </div>
                  </div>
                </div>
                
                <div className="bg-accent rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="text-3xl sm:text-4xl font-fredoka text-primary-foreground">50+</div>
                    <div className="text-xs sm:text-sm text-primary-foreground">
                      Familles heureuses qui nous
                      <br />
                      font confiance pour leurs services.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Collage d'images avec superposition - Responsive */}
            <div className={`relative transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              {/* Image principale (en arrière) */}
              <div className="relative z-10">
                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
                  <img 
                    src={aboutImage1} 
                    alt="Éducatrice avec des enfants"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Image 2 superposée (en haut à droite) - Responsive */}
              <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 lg:-top-8 lg:-right-8 z-20 w-32 h-24 sm:w-40 sm:h-30 lg:w-48 lg:h-36">
                <div className="w-full h-full rounded-xl lg:rounded-2xl overflow-hidden shadow-xl border-2 lg:border-4 border-background">
                  <img 
                    src={aboutImage2} 
                    alt="Enfants qui jouent"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Image 3 superposée (en bas à gauche) - Responsive */}
              <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 lg:-bottom-8 lg:-left-8 z-20 w-32 h-24 sm:w-40 sm:h-30 lg:w-48 lg:h-36">
                <div className="w-full h-full rounded-xl lg:rounded-2xl overflow-hidden shadow-xl border-2 lg:border-4 border-background">
                  <img 
                    src={aboutImage3} 
                    alt="Heure du conte"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              
              {/* Courbes décoratives */}
              <svg className="absolute -top-12 -right-12 w-24 h-24 text-accent/20" viewBox="0 0 100 100">
                <path d="M20,50 Q50,20 80,50 Q50,80 20,50" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              
              <svg className="absolute -bottom-12 -left-12 w-32 h-32 text-secondary/20" viewBox="0 0 100 100">
                <path d="M10,10 Q90,10 90,90" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom wave divider */}

    </>
  );
};

export default AboutSection;