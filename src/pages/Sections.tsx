import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Baby, Heart, BookOpen, Users, Clock, Euro } from 'lucide-react';
import galleryMain from '@/assets/gallery-main.jpg';
import ourSec from '@/assets/our-sec.jpg';

const Sections = () => {
  const sections = [
    {
      id: 'creche_etoile',
      title: 'Crèche SectionEtoile',
      ageRange: '3 - 18 mois',
      capacity: '15 enfants',
      ratio: '1 adulte pour 5 bébés',
      color: 'primary',
      icon: Baby,
      description: 'Un cocon douillet pour les premiers mois de découverte',
      activities: [
        'Éveil sensoriel et motricité douce',
        'Exploration des textures et des sons',
        'Initiation musicale et moments de détente',
        'Jeux de manipulation et d’exploration libre'
      ],
      schedule: {
        morning: 'accueil personnalisé, temps de soin, biberon et activités sensorielles',
        midday: 'repas adapté, moments calmes et sieste longue',
        afternoon: 'éveil en douceur, moment de découverte en plein air et goûter'
      }
    },
    {
      id: 'creche_nuage',
      title: 'Section Crèche Nuage',
      ageRange: '18 - 24 mois',
      capacity: '20 enfants',
      ratio: '1 adulte pour 8 enfants',
      color: 'secondary',
      icon: Heart,
      description: 'L\'âge des premières explorations et de l\'autonomie naissante',
      activities: [
        'Motricité libre et parcours',
        'Peinture et arts plastiques',
        'Chansons et comptines',
        'Jeux de construction',
      ],
      schedule: {
        morning: 'Activités d\'éveil, collation',
        midday: 'Repas en groupe, sieste',
        afternoon: 'Jeux libres, goûter, histoire'
      }
    },
    {
      id: 'creche_soleil',
      title: 'Section Crèche Soleil',
      ageRange: '24 - 36 mois',
      capacity: '30 enfants',
      ratio: '1 adulte pour 10 enfants',
      color: 'accent',
      icon: BookOpen,
      description: 'Préparation douce vers l\'école maternelle',
      activities: [
        'Pré-graphisme et découverte de l\'écrit',
        'Ateliers scientifiques simples',
        'Théâtre et expression corporelle',
        'Sorties pédagogiques'
      ],
      schedule: {
        morning: 'Activités dirigées, temps libre',
        midday: 'Repas autonome, repos calme',
        afternoon: 'Ateliers créatifs, préparation départ'
      }
    },
    {
      id: 'garderie',
      title: 'Section Garderie',
      ageRange: '3 - 8 ans',
      capacity: '30 enfants',
      ratio: '1 adulte pour 12 enfants',
      color: 'primary',
      icon: Users,
      description: 'Accueil périscolaire',
      activities: [
        'Aide aux devoirs (primaire)',
        'Ateliers créatifs avancés',
        'Sports et activités physiques',
        'Sorties culturelles',
        'Projets collaboratifs'
      ],
      schedule: {
        morning: 'Accueil libre, jeux',
        midday: 'Cantine, temps calme',
        afternoon: 'Activités, goûter, jeux extérieurs'
      }
    },
    {
      id: 'maternelle_PS',
      title: 'Maternelle Petite Section ',
      ageRange: '3 ans',
      capacity: '20 enfants',
      ratio: '1 adulte pour 10 enfants',
      color: 'accent',
      icon: BookOpen,
      description: 'l\'école maternelle',
      activities: [
        'Pré-graphisme et découverte de l\'écrit',
        'Ateliers scientifiques simples',
        'Théâtre et expression corporelle',
        'Sorties pédagogiques'
      ],
      schedule: {
        morning: 'Activités dirigées, temps libre',
        midday: 'Repas autonome, repos calme',
        afternoon: 'Ateliers créatifs, préparation départ'
      }
    },
    {
      id: 'maternelle_MS',
      title: 'Maternelle Moyenne Section',
      ageRange: '3 - 4 ans',
      capacity: '20 enfants',
      ratio: '1 adulte pour 10 enfants',
      color: 'accent',
      icon: BookOpen,
      description: 'l\'école maternelle',
      activities: [
        'Pré-graphisme et découverte de l\'écrit',
        'Ateliers scientifiques simples',
        'Théâtre et expression corporelle',
        'Sorties pédagogiques'
      ],
      schedule: {
        morning: 'Activités dirigées, temps libre',
        midday: 'Repas autonome, repos calme',
        afternoon: 'Ateliers créatifs, préparation départ'
      }
    },
    {
      id: 'maternelle_GS',
      title: 'Maternelle Grande Section',
      ageRange: '4 - 5 ans',
      capacity: '20 enfants',
      ratio: '1 adulte pour 10 enfants',
      color: 'accent',
      icon: BookOpen,
      description: 'l\'école maternelle',
      activities: [
        'Pré-graphisme et découverte de l\'écrit',
        'Ateliers scientifiques simples',
        'Théâtre et expression corporelle',
        'Sorties pédagogiques'
      ],
      schedule: {
        morning: 'Activités dirigées, temps libre',
        midday: 'Repas autonome, repos calme',
        afternoon: 'Ateliers créatifs, préparation départ'
      }
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background image with overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${ourSec})`
            }}
          >
            <div className="absolute inset-0 bg-secondary/90 bg-gradient-to-b from-black/40 via-black/50 to-black/50"></div>
          </div>
          
          <div className="container-custom relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center space-x-2 bg-white/20 text-white px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Nos sections</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-fredoka text-white mb-6">
                Un accompagnement adapté à chaque âge
              </h1>
              <p className="text-lg text-white/90">
                Découvrez nos différentes sections conçues pour répondre aux besoins spécifiques de chaque tranche d'âge.
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 120" className="w-full h-20 text-background">
              <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
            </svg>
          </div>
        </section>

        {/* Sections */}
        {sections.map((section, index) => {
          const IconComponent = section.icon;
          const isEven = index % 2 === 0;
          
          return (
            <section key={section.id} className={`section-padding ${isEven ? 'bg-background' : 'bg-muted/30'}`}>
              <div className="container-custom">
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:grid-flow-dense' : ''}`}>
                  
                  {/* Content */}
                  <div className={!isEven ? 'lg:col-start-2' : ''}>
                    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-6 ${
                      section.color === 'primary' ? 'bg-primary/10 text-primary' :
                      section.color === 'secondary' ? 'bg-secondary/20 text-secondary' :
                      'bg-accent/20 text-accent'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm font-medium">{section.ageRange}</span>
                    </div>
                    
                    <h2 className="text-3xl font-fredoka text-foreground mb-4">
                      {section.title}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      {section.description}
                    </p>

                    {/* Capacity & Ratio */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="card-soft text-center">
                        <div className="text-2xl font-fredoka text-foreground mb-1">{section.capacity}</div>
                        <div className="text-sm text-muted-foreground">Maximum</div>
                      </div>
                      <div className="card-soft text-center">
                        <div className="text-sm font-medium text-foreground mb-1">Encadrement</div>
                        <div className="text-xs text-muted-foreground">{section.ratio}</div>
                      </div>
                    </div>

                    {/* Activities */}
                    <div className="mb-6">
                      <h3 className="font-fredoka text-lg text-foreground mb-3">Activités proposées</h3>
                      <ul className="space-y-2">
                        {section.activities.map((activity, i) => (
                          <li key={i} className="flex items-center space-x-2 text-muted-foreground">
                            <div className={`w-2 h-2 rounded-full ${
                              section.color === 'primary' ? 'bg-primary' :
                              section.color === 'secondary' ? 'bg-secondary' :
                              'bg-accent'
                            }`}></div>
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Schedule */}
                    <div className="card-soft">
                      <h4 className="font-fredoka text-foreground mb-3">Planning type</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Matin:</span> {section.schedule.morning}</div>
                        <div><span className="font-medium">Midi:</span> {section.schedule.midday}</div>
                        <div><span className="font-medium">Après-midi:</span> {section.schedule.afternoon}</div>
                      </div>
                    </div>
                  </div>

                  {/* Visual */}
                  <div className={!isEven ? 'lg:col-start-1' : ''}>
                    <div className="card-soft">
                      <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <IconComponent className={`w-20 h-20 mx-auto mb-4 ${
                            section.color === 'primary' ? 'text-primary' :
                            section.color === 'secondary' ? 'text-secondary' :
                            'text-accent'
                          }`} />
                          <p className="text-muted-foreground">Photos de la section {section.title.toLowerCase()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>
          );
        })}
      </main>
      <Footer />
    </div>
  );
};

export default Sections;