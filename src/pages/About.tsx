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
                <h2 className="text-3xl sm:text-3xl lg:text-4xl font-fredoka text-primary mb-6">
                  Notre histoire
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                  Les Petits Rayons de Soleil est née d’une passion pour la petite enfance et
d’un rêve simple : offrir aux enfants un lieu où ils puissent grandir dans la
joie, la sécurité et la confiance.
                  </p>

                  <p>
                  Notre établissement grandit jour après jour, tout comme les sourires des
enfants qui y ont fait leurs premiers pas. Aujourd’hui, Les Petits Rayons de
Soleil est devenue une référence d’accueil de qualité, alliant pédagogie
moderne, bienveillance et engagement éducatif, tout en restant fidèle à son
esprit familial.
                  </p>

                  <p>
                  Notre évolution s’est naturellement poursuivie avec l’ouverture de l’école
maternelle, afin d’accompagner les enfants dans la continuité de leur
développement jusqu’à l’entrée à l’école primaire.
                  </p>

                  <p>
                  Chaque jour, notre équipe met tout son cœur à créer un environnement où
les enfants apprennent, explorent et s’épanouissent, car ici, grandir est une
aventure lumineuse !
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
              <h2 className="text-3xl sm:text-3xl lg:text-4xl font-fredoka text-primary mb-4">
                Notre mission et notre vision
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card-soft">
                <Award className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-xl font-fredoka text-foreground mb-4">Notre Mission</h3>
                <p className="text-muted-foreground">
                      Offrir aux enfants un environnement qui nourrit leur curiosité et leur
      créativité, tout en développant leur capacité à interagir avec les autres et à
      explorer le monde. Nous nous engageons à accompagner chaque enfant
      dans son parcours unique, en valorisant la confiance, la responsabilisation et
      la découverte personnelle.
                </p>
              </div>
              <div className="card-soft">
                <Heart className="w-12 h-12 text-secondary mb-6" />
                <h3 className="text-xl font-fredoka text-foreground mb-4">Notre Vision</h3>
                <p className="text-muted-foreground">
                Être un établissement où l’éducation va au-delà de l’apprentissage
académique, en préparant les enfants à devenir des individus épanouis,
autonomes et ouverts sur le monde. Nous aspirons à créer une communauté
éducative inspirante, où parents et éducateurs travaillent ensemble pour
bâtir un futur enrichissant pour chaque enfant.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team section */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-3xl lg:text-4xl font-fredoka text-primary mb-4">
              Nos partenaires
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Pour offrir aux enfants un <strong>accompagnement complet et de qualité</strong>, <em>Les Petits
              Rayons de Soleil</em> s’entoure de <strong>professionnels spécialisés</strong> qui interviennent
  régulièrement au sein de l’établissement, participant à <strong>l’épanouissement global des enfants </strong>
  grâce à leur <strong>savoir-faire</strong> et à des <strong>activités enrichissantes</strong> qui
complètent notre approche pédagogique.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Team members placeholder - will be populated with real data */}
              {[
                { name: 'Pédiatre', qualification: ' Intervient en cas de besoin pour assurer la santé et le bien-être général des enfants.' },
                { name: 'Psychologue d’éducation', qualification: ' Accompagne le développement émotionnel social.' },
                { name: 'Psychomotricienne', qualification: ' Observe et soutient le développement de la motricité et de la coordination corporelle.' },
                { name: 'Orthophoniste', qualification: ' Veille au développement du langage et de la communication.' },
                { name: 'Maître-nageur', qualification: ' Initie les enfants à la natation en toute sécurité.' },
                { name: 'Professeur de musique', qualification: ' Développe la sensibilité musicale et la créativité.' },
                { name: 'Professeure de karaté', qualification: ' Enseigne discipline, confiance et coordination.' },
                { name: 'Professeure de danse', qualification: ' Favorise l’expression corporelle et le rythme.' },
                { name: 'Maître d’armes d’escrime', qualification: ' Stimule la concentration, les réflexes et l’esprit sportif.' }

              ].map((member, index) => (
                <div key={member.name} className="card-soft text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                    👨‍🏫
                  </div>
                  <h3 className="font-fredoka text-lg text-secondary mb-2">{member.name}</h3>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
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