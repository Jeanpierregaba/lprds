import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Heart, Users, Award, Clock } from 'lucide-react';
import aboutImage1 from '@/assets/about-image-1.jpg';
import aboutSec from '@/assets/about-sec.jpg';
import heroBg from '@/assets/hero-bg-v.jpg';

const About = () => {
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
              backgroundImage: `url(${aboutSec})`
            }}
          >
            <div className="absolute inset-0 bg-primary/90 bg-gradient-to-b from-black/40 via-black/50 to-black/50"></div>
          </div>
          
          <div className="container-custom section-padding relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center space-x-2 bg-white/20 text-white px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">À propos</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-fredoka text-white mb-6">
                Notre histoire et nos valeurs
              </h1>
              <p className="text-lg text-white/90">
                Découvrez l'histoire des Petits Rayons de Soleil et l'équipe passionnée qui accompagne vos enfants chaque jour.
              </p>
            </div>
          </div>

          {/* Bottom wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 120" className="w-full h-20 text-background">
              <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
            </svg>
          </div>
        </section>

        {/* Story section */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-fredoka text-foreground mb-6">
                  Notre histoire
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                  Chez Les Petits Rayons de Soleil, nous croyons fermement que chaque enfant
possède un potentiel unique et infini. Notre vision est de permettre à chaque
enfant de développer ses compétences à son propre rythme, dans un
environnement bienveillant et sécurisé.
                  </p>
                  <p>
                  Nous nous inspirons des méthodes Montessori et proposons un
programme bilingue (anglais et français) tout en intégrant l'apprentissage de la
langue des signes (le bébé signe), afin de favoriser une communication efficace et
un développement linguistique enrichi dès le plus jeune âge.
                  </p>
                  <p>
                    Aujourd'hui, notre crèche accueille plus de 80 enfants et emploie une équipe 
                    d'une dizaine de professionnels qualifiés, tous unis par la même passion : accompagner 
                    les enfants dans leur développement avec bienveillance et professionnalisme.
                  </p>
                </div>
              </div>
              <div className="card-soft">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center">
                  <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xlx">
                    <img 
                      src={heroBg} 
                      alt="Children and educators in a loving daycare environment"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="section-padding bg-muted/30">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-fredoka text-foreground mb-4">
                Notre mission et notre vision
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card-soft">
                <Award className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-xl font-fredoka text-foreground mb-4">Notre Mission</h3>
                <p className="text-muted-foreground">
                  Accompagner chaque enfant dans son développement global - moteur, cognitif, 
                  social et émotionnel - en respectant son rythme et ses besoins individuels. 
                  Créer un pont solide entre la famille et l'école.
                </p>
              </div>
              <div className="card-soft">
                <Heart className="w-12 h-12 text-secondary mb-6" />
                <h3 className="text-xl font-fredoka text-foreground mb-4">Notre Vision</h3>
                <p className="text-muted-foreground">
                  Être reconnue comme la référence en matière d'accueil de qualité pour les 
                  jeunes enfants, où l'épanouissement personnel, la bienveillance et 
                  l'excellence éducative se conjuguent harmonieusement.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team section */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-fredoka text-foreground mb-4">
                Notre équipe pédagogique
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Des professionnels qualifiés et passionnés, formés en continu pour offrir 
                le meilleur accompagnement à vos enfants.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Team members placeholder - will be populated with real data */}
              {[
                { name: 'Victoire ATAKPLA', role: 'Directrice', qualification: '' },
                { name: 'Sophie Martin', role: 'Éducatrice référente', qualification: 'CAP Petite Enfance, 8 ans' },
                { name: 'Julie Moreau', role: 'Auxiliaire puéricultrice', qualification: 'Diplôme d\'État, 6 ans' },
                { name: 'Claire Dubois', role: 'Psychomotricienne', qualification: 'DE Psychomotricité, 4 ans' },
                { name: 'Emma Bernard', role: 'Éducatrice spécialisée', qualification: 'DEES, 10 ans d\'expérience' },
                { name: 'Lucas Petit', role: 'Agent technique', qualification: 'BTS Hygiène Sécurité, 3 ans' }
              ].map((member, index) => (
                <div key={member.name} className="card-soft text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                    👨‍🏫
                  </div>
                  <h3 className="font-fredoka text-lg text-foreground mb-2">{member.name}</h3>
                  <p className="text-primary font-medium mb-1">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.qualification}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="section-padding bg-accent text-primary-foreground">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-fredoka mb-4">
                Nos chiffres en quelques mots
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <Clock className="w-8 h-8 mx-auto mb-4 text-secondary" />
                <div className="text-3xl font-fredoka mb-2">3</div>
                <div className="text-sm opacity-80">Années d'expérience</div>
              </div>
              <div>
                <Users className="w-8 h-8 mx-auto mb-4 text-secondary" />
                <div className="text-3xl font-fredoka mb-2">80+</div>
                <div className="text-sm opacity-80">Enfants accueillis</div>
              </div>
              <div>
                <Award className="w-8 h-8 mx-auto mb-4 text-secondary" />
                <div className="text-3xl font-fredoka mb-2">15</div>
                <div className="text-sm opacity-80">Professionnels qualifiés</div>
              </div>
              <div>
                <Heart className="w-8 h-8 mx-auto mb-4 text-secondary" />
                <div className="text-3xl font-fredoka mb-2">100%</div>
                <div className="text-sm opacity-80">Parents satisfaits</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;