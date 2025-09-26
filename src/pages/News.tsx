import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, Tag, Search, Bell, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import whyChooseUsMain from '@/assets/why-choose-us-main.jpg';

const News = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'Toutes les actualités', color: 'primary' },
    { id: 'events', name: 'Événements', color: 'secondary' },
    { id: 'outings', name: 'Sorties', color: 'accent' },
    { id: 'pedagogy', name: 'Projets pédagogiques', color: 'primary' },
    { id: 'info', name: 'Informations parents', color: 'secondary' }
  ];

  const articles = [
    {
      id: 1,
      title: 'Carnaval 2024 : Une fête colorée et joyeuse !',
      category: 'events',
      date: '2024-03-15',
      image: '🎭',
      excerpt: 'Les enfants ont célébré le carnaval avec des déguisements magnifiques et une parade dans le jardin. Une journée inoubliable !',
      featured: true
    },
    {
      id: 2,
      title: 'Sortie au parc de la Tête d\'Or',
      category: 'outings',
      date: '2024-03-10',
      image: '🌳',
      excerpt: 'Découverte de la nature et des animaux pour les sections moyens et grands. Les enfants ont adoré nourrir les canards.',
    },
    {
      id: 3,
      title: 'Nouveau projet : Jardin pédagogique',
      category: 'pedagogy',
      date: '2024-03-05',
      image: '🌱',
      excerpt: 'Lancement de notre jardin pédagogique ! Les enfants vont pouvoir planter, arroser et voir pousser leurs propres légumes.',
    },
    {
      id: 4,
      title: 'Rappel : Fermeture exceptionnelle',
      category: 'info',
      date: '2024-02-28',
      image: '📅',
      excerpt: 'La crèche sera fermée le lundi 1er avril pour une journée de formation de l\'équipe pédagogique.',
    },
    {
      id: 5,
      title: 'Atelier cuisine : Les petits chefs !',
      category: 'events',
      date: '2024-02-20',
      image: '👨‍🍳',
      excerpt: 'Les enfants ont préparé des cookies avec notre cuisinière. Ils étaient si fiers de repartir avec leurs créations !',
    },
    {
      id: 6,
      title: 'Spectacle de marionnettes',
      category: 'events',
      date: '2024-02-15',
      image: '🎭',
      excerpt: 'La compagnie "Les Marionnettes Magiques" est venue présenter un spectacle sur les émotions. Les enfants étaient captivés !',
    },
    {
      id: 7,
      title: 'Nouvelle activité : Baby yoga',
      category: 'pedagogy',
      date: '2024-02-10',
      image: '🧘‍♀️',
      excerpt: 'Introduction du baby yoga pour les tout-petits. Une activité douce qui favorise la détente et la coordination.',
    },
    {
      id: 8,
      title: 'Inscriptions 2024-2025 ouvertes',
      category: 'info',
      date: '2024-02-01',
      image: '📝',
      excerpt: 'Les inscriptions pour la rentrée 2024-2025 sont ouvertes ! N\'hésitez pas à nous contacter pour une visite.',
    }
  ];

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticle = articles.find(article => article.featured);
  const regularArticles = filteredArticles.filter(article => !article.featured);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'primary';
  };

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
              backgroundImage: `url(${whyChooseUsMain})`
            }}
          >
            <div className="absolute inset-0 bg-primary/90"></div>
          </div>
          
          <div className="container-custom relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center space-x-2 bg-white/20 text-white px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Actualités</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-fredoka text-white mb-6">
                Toute l'actualité de la crèche
              </h1>
              <p className="text-lg text-white/90 mb-8">
                Suivez la vie quotidienne, les événements et les projets des Petits Rayons de Soleil.
              </p>

              {/* Newsletter signup */}
              <div className="card-soft max-w-md mx-auto bg-white/10 backdrop-blur-md border-white/20">
                <div className="flex items-center space-x-3 mb-4">
                  <Bell className="w-6 h-6 text-white" />
                  <h3 className="font-fredoka text-lg text-white">Restez informés</h3>
                </div>
                <p className="text-sm text-white/80 mb-4">
                  Inscrivez-vous à notre newsletter pour ne rien manquer !
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Votre email"
                    className="flex-1 px-3 py-2 border border-white/30 bg-white/20 backdrop-blur-sm rounded-lg text-sm text-white placeholder-white/60 focus:border-white/50 focus:ring-white/30"
                  />
                  <button className="px-4 py-2 text-sm bg-white text-primary rounded-lg hover:bg-white/90 transition-colors">
                    S'abonner
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 120" className="w-full h-20 text-background">
              <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
            </svg>
          </div>
        </section>

        {/* Search and filters */}
        <section className="section-padding py-8 border-b border-border">
          <div className="container-custom">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg"
                />
              </div>

              {/* Category filters */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedCategory === category.id
                        ? `bg-${category.color} text-${category.color}-foreground shadow-lg`
                        : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <Tag className="w-3 h-3 inline mr-1" />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured article */}
        {featuredArticle && selectedCategory === 'all' && !searchTerm && (
          <section className="section-padding py-12">
            <div className="container-custom">
              <div className="card-soft max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="aspect-video bg-gradient-to-br from-secondary/20 to-primary/10 rounded-xl flex items-center justify-center text-6xl">
                    {featuredArticle.image}
                  </div>
                  <div>
                    <div className="inline-flex items-center space-x-2 bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm mb-4">
                      <Tag className="w-3 h-3" />
                      <span>À la une</span>
                    </div>
                    <h2 className="text-2xl font-fredoka text-foreground mb-4">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      {featuredArticle.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(featuredArticle.date)}</span>
                      </div>
                      <button className="btn-primary text-sm">
                        Lire la suite
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Articles grid */}
        <section className="section-padding">
          <div className="container-custom">
            {regularArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularArticles.map((article, index) => (
                  <article
                    key={article.id}
                    className="card-soft hover:scale-105 cursor-pointer animate-fade-in-up"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    {/* Image placeholder */}
                    <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-xl mb-4 flex items-center justify-center text-4xl">
                      {article.image}
                    </div>

                    {/* Category and date */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                        getCategoryColor(article.category) === 'primary' ? 'bg-primary/20 text-primary' :
                        getCategoryColor(article.category) === 'secondary' ? 'bg-secondary/20 text-secondary' :
                        'bg-accent/20 text-accent'
                      }`}>
                        <Tag className="w-3 h-3" />
                        <span>{categories.find(cat => cat.id === article.category)?.name}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(article.date)}</span>
                      </div>
                    </div>

                    {/* Title and excerpt */}
                    <h3 className="font-fredoka text-lg text-foreground mb-3 hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>

                    {/* Read more */}
                    <button className="text-primary text-sm font-medium hover:underline">
                      Lire plus →
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-fredoka text-xl text-foreground mb-2">
                  Aucun article trouvé
                </h3>
                <p className="text-muted-foreground">
                  Essayez de modifier vos critères de recherche ou votre sélection de catégorie.
                </p>
              </div>
            )}

            {/* Load more button */}
            {regularArticles.length > 0 && (
              <div className="text-center mt-12">
                <button className="btn-primary">
                  Charger plus d'articles
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default News;