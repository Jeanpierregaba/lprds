import { Heart, Shield, Users, BookOpen, Send, Brain, Dices } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import whyChooseUsImage from '@/assets/why-choose-us-main.jpg';
import whyDiff from '@/assets/why-diff.jpg';

const WhyChooseUsSection = () => {
  const [ref, isVisible] = useScrollAnimation();
  
  const reasons = [
    {
      icon: BookOpen,
      title: "Programme bilingue français / anglais ",
      description: "Une ouverture au monde dès le plus jeune âge grâce à un apprentissage naturel des deux langues.",
    },
    {
      icon: Brain,
      title: "Pédagogie Montessori",
      description: "Une approche favorisant l’autonomie, la curiosité et l’apprentissage par l’expérience.",
    },
    {
      icon: Heart,
      title: "Soins Personnalisés",
      description: "Chaque enfant reçoit une attention adaptée à ses besoins spécifiques et à son développement.",
    },
    {
      icon: Shield,
      title: "Environnement Sécurisé",
      description: "Notre établissement est conçu pour la sécurité des enfants avec un personnel formé.",
    },
    {
      icon: Users,
      title: "Éducatrices Formées",
      description: "Une équipe qualifiée, passionnée et en formation continue, dédiée au bienêtre et à la progression de chaque enfant.",
    },
    {
      icon: BookOpen,
      title: "Routines Structurées",
      description: "Des journées équilibrées entre apprentissage, jeu et repos, pour un développement harmonieux.",
    },
    {
      icon: Dices,
      title: "Activités extrascolaires enrichissantes :",
      description: "Natation, karaté, escrime et danse contemporaine — pour stimuler la motricité, la confiance et la discipline.",
    },
    {
      icon: Dices,
      title: "Espace de jeux spacieux et équipé",
      description: "Un lieu sûr et stimulant où l’enfant apprend en explorant et en s’amusant.",
    }
  ];

  return (
    <section ref={ref} className="section-padding bg-gradient-to-br from-background to-muted/30 relative overflow-hidden">

      
      <div className="container mx-auto px-4 relative">
        <div className={`text-center space-y-4 mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-lg font-bold text-secondary tracking-wider uppercase mb-4">
            Pourquoi Nous Sommes Différents
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-fredoka text-foreground leading-tight">
            <span className='text-primary'>Engagés</span> pour la <span className='text-primary'>Croissance</span> et<br className="hidden sm:block" />
            le <span className='text-primary'>Bonheur</span> de Votre <span className='text-primary'>Enfant</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Offrir à votre enfant le meilleur, c’est lui permettre de grandir, découvrir et
s’épanouir dans un environnement bienveillant, stimulant et entièrement
pensé pour son éveil et sa sécurité.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Liste des avantages */}
          <div className="space-y-8">
            {reasons.map((reason, index) => (
              <div 
                key={index} 
                className={`flex items-start space-x-5 group transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-ternegreen rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <reason.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-secondary">{reason.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{reason.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Image principale */}
          <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="relative">
              {/* Image principale */}
              <div className="relative overflow-hidden rounded-3xl mb-10">
                <img 
                  src={whyDiff} 
                  alt="Éducateur jouant avec un enfant" 
                  className="w-full h-auto object-cover"
                />
                {/* Overlay gradient pour améliorer la lisibilité */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
              </div>

              <div className="relative overflow-hidden rounded-3xl">
                <img 
                  src={whyDiff} 
                  alt="Éducateur jouant avec un enfant" 
                  className="w-full h-auto object-cover"
                />
                {/* Overlay gradient pour améliorer la lisibilité */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;