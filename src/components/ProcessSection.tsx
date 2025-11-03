import { Calendar, FileText, Users, BadgeCheck, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const ProcessSection = () => {
  const [ref, isVisible] = useScrollAnimation();
  
  const steps = [
    {
      step: "1",
      title: "Une visite (30 min) :",
      description: "Explorez les locaux. Posez vos questions. Rassurez-vous.",
      icon: Eye,
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      step: "2", 
      title: "Fiche d'inscription :",
      description: "Infos essentielles + besoins de votre enfant.",
      icon: FileText,
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      step: "3",
      title: " Démarrage confirmé :",
      description: "Bienvenue chez Les Petits Rayons de Soleil !",
      icon: BadgeCheck,
      bgColor: "bg-green-100", 
      iconColor: "text-green-600"
    }
  ];

  return (
    <section ref={ref} className="section-padding bg-gradient-to-br from-blue-50/50 to-purple-50/30 relative overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute top-20 right-10 w-20 h-20 bg-secondary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 left-8 w-16 h-16 bg-accent/10 rounded-full blur-lg"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className={`text-center space-y-6 mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-lg font-bold text-secondary tracking-wider uppercase">
            ÉTAPES
          </div>
          <h2 className="text-4xl lg:text-5xl font-fredoka text-foreground leading-tight">
            <span className='text-primary'>Rejoignez-nous </span>en 3 étapes simples :
          </h2>
        </div>
        
        <div className="relative max-w-5xl mx-auto">
          
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="text-center space-y-6">
                  {/* Numéro d'étape avec icône */}
                  <div className="relative inline-block">
                    <div className={`w-20 h-20 ${step.bgColor} rounded-full flex items-center justify-center relative z-0 mx-auto`}>
                      <span className="text-2xl font-bold text-primary">{step.step}</span>
                    </div>
                    {/* Icône en overlay */}
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-white">
                      <step.icon className={`w-5 h-5 ${step.iconColor}`} />
                    </div>
                  </div>
                  
                  {/* Contenu de l'étape */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-secondary leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm max-w-xs mx-auto">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default ProcessSection;