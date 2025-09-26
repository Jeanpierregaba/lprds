import { Heart, Shield, BookOpen, Sparkles, Users, Smile } from 'lucide-react';

const Values = () => {
  const values = [
    {
      icon: Heart,
      title: 'Bienveillance',
      description: 'Chaque enfant est accueilli avec amour et respect dans un climat de confiance.',
      color: 'text-primary'
    },
    {
      icon: Sparkles,
      title: 'Épanouissement',
      description: 'Nous favorisons le développement personnel et la créativité de chaque enfant.',
      color: 'text-secondary'
    },
    {
      icon: Shield,
      title: 'Sécurité',
      description: 'Un environnement sécurisé avec des protocoles stricts pour la tranquillité des parents.',
      color: 'text-accent'
    },
    {
      icon: BookOpen,
      title: 'Apprentissage',
      description: 'Des activités éducatives adaptées à chaque âge pour préparer l\'avenir.',
      color: 'text-primary'
    },
    {
      icon: Users,
      title: 'Socialisation',
      description: 'Apprendre à vivre ensemble, partager et développer les liens sociaux.',
      color: 'text-secondary'
    },
    {
      icon: Smile,
      title: 'Joie de vivre',
      description: 'La joie et le sourire sont au cœur de toutes nos activités quotidiennes.',
      color: 'text-accent'
    }
  ];

  return (
    <section className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">Nos valeurs</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-fredoka text-foreground mb-4">
            Ce qui nous guide chaque jour
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nos valeurs fondamentales créent un environnement où chaque enfant peut grandir sereinement et développer tout son potentiel.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const IconComponent = value.icon;
            return (
              <div 
                key={value.title}
                className="card-soft group hover:scale-105 cursor-pointer animate-fade-in-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-background to-muted mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`w-8 h-8 ${value.color}`} />
                  </div>
                  <h3 className="text-xl font-fredoka text-foreground mb-3">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="card-soft max-w-md mx-auto">
            <Sparkles className="w-8 h-8 text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-fredoka text-foreground mb-2">
              Découvrez notre approche
            </h3>
            <p className="text-muted-foreground mb-4">
              Venez visiter notre crèche et rencontrer notre équipe pédagogique.
            </p>
            <button className="btn-secondary w-full">
              Prendre rendez-vous
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Values;