import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Heart, Users, Award, Clock } from 'lucide-react';
import aboutImage1 from '@/assets/about-image-1.jpg';
import aboutSec from '@/assets/about-sec.jpg';
import heroBg from '@/assets/hero-bg-v.jpg';
import { PageHero } from '@/components/common/PageHero';

const About = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero section */}
        <PageHero
          title="Notre histoire et nos valeurs"
          subtitle="Découvrez l'histoire des Petits Rayons de Soleil et l'équipe passionnée qui accompagne vos enfants chaque jour."
          badgeText="À propos"
          badgeIcon={Heart}
          backgroundImage={aboutSec}
          gradientOverlay="bg-primary/90 bg-gradient-to-b from-black/40 via-black/50 to-black/50"
        />

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
              Pour offrir aux enfants un <span className="font-semibold text-accent">accompagnement complet et de qualité</span>, <em>Les Petits
              Rayons de Soleil</em> s’entoure de <span className="font-semibold text-accent">professionnels spécialisés</span> qui interviennent
  régulièrement au sein de l’établissement, participant à <span className="font-semibold text-accent">l’épanouissement global des enfants </span>
  grâce à leur <span className="font-semibold text-accent">savoir-faire</span> et à des <span className="font-semibold text-accent">activités enrichissantes</span> qui
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
        <section className="section-padding py-12 sm:py-16 lg:py-20 bg-accent text-primary-foreground">
          <div className="container-custom px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-fredoka mb-3 sm:mb-4">
                Nos chiffres en quelques mots
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 text-center">
              <div className="p-4 sm:p-6">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-3 sm:mb-4 text-secondary" />
                <div className="text-2xl sm:text-3xl font-fredoka mb-1 sm:mb-2">80+</div>
                <div className="text-xs sm:text-sm opacity-80">Enfants accueillis</div>
              </div>
              <div className="p-4 sm:p-6">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-3 sm:mb-4 text-secondary" />
                <div className="text-2xl sm:text-3xl font-fredoka mb-1 sm:mb-2">15</div>
                <div className="text-xs sm:text-sm opacity-80">Professionnels qualifiés</div>
              </div>
              <div className="p-4 sm:p-6 col-span-2 lg:col-span-1">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-3 sm:mb-4 text-secondary" />
                <div className="text-2xl sm:text-3xl font-fredoka mb-1 sm:mb-2">100%</div>
                <div className="text-xs sm:text-sm opacity-80">Parents satisfaits</div>
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