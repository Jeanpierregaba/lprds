
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import crecheIcon from '@/assets/creche-icon.png';
import garderieIcon from '@/assets/garderie-icon.png';
import materIcon from '@/assets/maternelle-icon.png';

const ServicesSection = () => {
  const [ref, isVisible] = useScrollAnimation();
  
  const services = [
    {
      title: "Crèche",
      description: "Accueil des enfants de 3 mois à 3 ans dans un environnement chaleureux et bienveillant, favorisant leur éveil, leur motricité et leurspremières interactions sociales. À travers le jeu, la découverte sensorielle et les activités d’exploration, chaque enfant développe à son rythme sa curiosité, son autonomie et sa confiance en lui.",
      img : crecheIcon,
      color : "ternegreen"
    },
    {
      title: "Garderie",
      description: "Prise en charge des enfants de 3 mois à 8 ans pour des gardes occasionnelles ou en accueil après l’école, axée sur l’éveil, le jeu éducatif et le développement harmonieux de l’enfant.",
      img : garderieIcon,
      color : "ternegreen"
    },
    {
      title: "Ecole Maternelle",
      description: "Programme éducatif préscolaire conforme au programme français, destiné aux enfants de 3 à 5 ans. Il favorise l’épanouissementglobal de l’enfant à travers le développement du langage, la découverte du monde, l’expression artistique et corporelle, ainsi que l’acquisition des premières bases de la réflexion et de la socialisation.",
      img : materIcon,
      color : "ternegreen"
    }
  ];

  return (

    <section ref={ref} className="section-padding bg-muted">

      <div className="container mx-auto px-4">
        <div className={`text-center space-y-4 mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-lg font-bold text-secondary tracking-wider uppercase mb-4">
            Nos Services
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-fredoka text-foreground">
            Des soins <span className='text-primary'>personnalisés</span>, de grands <span className='text-primary'>sourires</span> <br className="hidden sm:block"></br>et des <span className='text-primary'>compétences</span> pour toute la <span className='text-primary'>vie</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Des services complets et adaptés pour accompagner votre enfant dans ses premiers pas vers l'autonomie
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {services.map((service, index) => (
            <div 
              key={index} 
              className={`card-soft group hover:scale-105 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="flex-col space-y-6 text-center">
                <div className={`bg-ternegreen rounded-full relative inline-block p-5 `}>
                  <img src={service.img} alt="" className='w-12 h-12 mx-auto'/>
                </div>
                  
                <div className="space-y-2">
                  <div className="flex items-center justify-center">
                    <h3 className="text-2xl font-semibold text-secondary">{service.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

  );
};

export default ServicesSection;