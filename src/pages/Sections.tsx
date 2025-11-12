import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Baby, Heart, BookOpen, Users, Clock, Euro } from 'lucide-react';
import galleryMain from '@/assets/gallery-main.jpg';
import ourSec from '@/assets/our-sec.jpg';

const Sections = () => {
  const sections = [
    {
      id: 'creche_etoile',
      title: 'Crèche - Section Etoile',
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
      title: 'Crèche - Section Nuage',
      ageRange: '18 - 24 mois',
      capacity: '16 enfants',
      ratio: '1 adulte pour 8 enfants',
      color: 'secondary',
      icon: Heart,
      description: 'L\'âge des premières explorations et de l\'autonomie naissante',
      activities: [
        'Motricité libre et parcours de découverte',
        'Premiers gestes artistiques : peinture, collage et modelage',
        'Chansons, comptines et manipulation',
        'Jeux de construction et d’imitation',
        'Moments d’observation et d’exploration en extérieur'
      ],
      schedule: {
        morning: 'accueil chaleureux, activités sportif, cercle matinal, collation conviviale, activités d’éveil, de motricité fine ou global',
        midday: 'repas en groupe, rituel de sieste',
        afternoon: 'bricolage, temps d’activités en extérieur, jeux libres, histoire, comptine'
      }
    },
    {
      id: 'creche_soleil',
      title: 'Crèche - Section Soleil',
      ageRange: '24 - 36 mois',
      capacity: '16 enfants',
      ratio: '1 adulte pour 8 enfants',
      color: 'accent',
      icon: BookOpen,
      description: 'Une préparation douce et joyeuse vers l’école maternelle',
      activities: [
        'Pré-graphisme et découverte de l\'écrit',
        'Expériences scientifiques simples et observations ludiques',
        'Théâtre, expression corporelle et jeux de rôle',
        'Ateliers créatifs et sensoriels',
        'Découvertes extérieures et mini-sorties pédagogiques'
      ],
      schedule: {
        morning: 'accueil chaleureux, activités sportives, cercle matinal, collation conviviale, ateliers dirigés d’éveil et de motricité fine ou globale',
        midday: 'repas en semi-autonomie, rituel de sieste',
        afternoon: 'ateliers créatifs, temps d’activités en plein air,, lecture, comptine, temps libre d’exploration'
      }
    },
    {
      id: 'garderie',
      title: 'Section Garderie',
      ageRange: '3 - 8 ans',
      capacity: '10 enfants',
      ratio: '1 adulte pour 10 enfants',
      color: 'primary',
      icon: Users,
      description: 'Accueil périscolaire : un espace d’épanouissement et d’accompagnement après l’école',
      activities: [
        'Aide personnalisée aux devoirs (niveau primaire)',
        'Ateliers créatifs et manuels',
        'Activités sportives et jeux collectifs',
        'Découvertes culturelles et ludiques',
        'Projets de groupe favorisant la coopération et l’autonomie'
      ],
      schedule: {
        midday: 'repas à la cantine, temps calme',
        afternoon: 'aide aux devoirs, activités thématiques, goûter et jeux en plein air'
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
      description: 'La Petite Section marque le début du parcours scolaire. À cet âge, l’enfant découvre le plaisir d’apprendre à travers le jeu, le mouvement et la communication.',
      activities: [
        'Mobilisation du language : développement de l’expression orale, premières comptines (salutations, couleurs, objets).',
        'Activité physique : motricité fine et globale, jeux d’équilibre et parcours moteurs.',
        'Activités artistiques : dessin, peinture, modelage, musique et découverte des sons.',
        'Les premiers outils pour structurer sa pensée : premiers jeux mathématiques, tri, classement, reconnaissance des formes et couleurs.',
        'Explorer le monde : observation de la nature, découverte des animaux, des saisons et des cinq sens.'
      ],
      schedule: {
        morning: 'accueil individualisé, jeux libres, rituels du jour, ateliers dirigés, chansons et activités d’apprentissage.',
        midday: 'repas autonome suivi d’un temps de sieste.',
        afternoon: 'ateliers créatifs, temps d’exploration et de jeux en extérieur'
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
      description: 'En Moyenne Section, les apprentissages se consolident. L’enfant affine son langage, sa motricité et commence à organiser sa pensée. Les activités favorisent la curiosité, l’autonomie et la coopération avec les autres.',
      activities: [
        'Langage et communication : enrichissement du vocabulaire, phrases complètes, premiers jeux phonologiques, anglais oral quotidien.',
        'Activités physiques et sportives : coordination, jeux collectifs, équilibre, danses',
        'Arts et expression : peinture, bricolage, expression corporelle et chant',
        'Découverte du monde et premiers outils mathématiques : repérage dans le temps et l’espace, tri, comparaison, reconnaissance des nombres et des quantités',
        'Observation et curiosité scientifique : petites expériences sensorielles, découverte des plantes et des animaux.'
      ],
      schedule: {
        morning: 'accueil individualisé, jeux libres, rituels du jour, ateliers dirigés, chansons et activités d’apprentissage',
        midday: 'repas en autonomie, sieste ou temps calme',
        afternoon: 'ateliers scientifiques, activités artistiques, exploration et de jeux en extérieur'
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
      description: 'La Grande Section prépare en douceur le passage vers l’école primaire. Les activités développent la curiosité intellectuelle, la rigueur, la confiance en soi et l’envie d’apprendre. L’anglais devient plus structuré à travers des jeux, chansons et situations de la vie quotidienne',
      activities: [
        'Langage oral et écrit : conscience phonologique, reconnaissance des lettres, premiers mots simples, initiation à la lecture.',
        'Agir et s’exprimer à travers le corps : activités sportives, danses, motricité fine et autonomie.',
        'Arts et créativité : dessin d’observation, créations collectives, théâtre et musique',
        'Découverte des nombres et du raisonnement logique : comparaison, suite logique, comptage jusqu’à 20, premiers calculs simples.',
        'Explorer le monde et l’environnement : découverte des saisons, du temps qui passe, des métiers et du monde vivant.'
      ],
      schedule: {
        morning: 'accueil individualisé, jeux libres, rituels du jour, ateliers dirigés, chansons et activités d’apprentissage.',
        midday: 'repas en autonomie, sieste, temps calme ou lecture',
        afternoon: 'projets collectifs, anglais, jeux éducatifs, exploration et de jeux en extérieur.'
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