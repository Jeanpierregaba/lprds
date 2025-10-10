import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Camera, Play, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import galleryMain from '@/assets/gallery-main.jpg';
import gallery1 from '@/assets/gallery-1.jpg';
import gallery2 from '@/assets/gallery-2.jpg';
import aboutImage1 from '@/assets/about-image-1.jpg';
import aboutImage2 from '@/assets/about-image-2.jpg';
import aboutImage3 from '@/assets/about-image-3.jpg';
import heroImage from '@/assets/hero-image.jpg';
import whyChooseUsMain from '@/assets/why-choose-us-main.jpg';
import lifeGard from '@/assets/life-gard.jpg';

const Gallery = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = [
    { id: 'all', name: 'Tout voir', count: 24 },
    { id: 'activities', name: 'Activités manuelles', count: 8 },
    { id: 'outdoor', name: 'Jeux extérieurs', count: 6 },
    { id: 'meals', name: 'Repas', count: 4 },
    { id: 'rest', name: 'Temps calme', count: 3 },
    { id: 'events', name: 'Fêtes & sorties', count: 3 }
  ];

  // Gallery data with real images
  const mediaItems = [
    { id: 1, category: 'activities', type: 'image', title: 'Atelier peinture', description: 'Les enfants découvrent les couleurs', image: galleryMain },
    { id: 2, category: 'outdoor', type: 'image', title: 'Jeux dans le jardin', description: 'Moment de détente à l\'extérieur', image: gallery1 },
    { id: 3, category: 'activities', type: 'video', title: 'Chanson du matin', description: 'Rituel musical quotidien', image: null },
    { id: 4, category: 'meals', type: 'image', title: 'Déjeuner ensemble', description: 'Apprentissage de l\'autonomie', image: gallery2 },
    { id: 5, category: 'events', type: 'image', title: 'Fête de printemps', description: 'Célébration avec les familles', image: aboutImage1 },
    { id: 6, category: 'rest', type: 'image', title: 'Lecture calme', description: 'Moment de détente et d\'éveil', image: aboutImage2 },
    { id: 7, category: 'activities', type: 'image', title: 'Construction libre', description: 'Développement de la créativité', image: aboutImage3 },
    { id: 8, category: 'outdoor', type: 'image', title: 'Découverte nature', description: 'Sortie pédagogique au parc', image: heroImage },
    { id: 9, category: 'activities', type: 'video', title: 'Atelier cuisine', description: 'Préparation du goûter', image: null },
    { id: 10, category: 'meals', type: 'image', title: 'Goûter d\'anniversaire', description: 'Moment de partage et de joie', image: whyChooseUsMain },
    { id: 11, category: 'events', type: 'image', title: 'Spectacle de marionnettes', description: 'Animation spéciale pour les enfants', image: galleryMain },
    { id: 12, category: 'rest', type: 'image', title: 'Sieste paisible', description: 'Repos mérité après les activités', image: gallery1 }
  ];

  const imageItems = mediaItems.filter(item => item.type === 'image' && item.image);

  const openModal = (index: number) => {
    const imageIndex = imageItems.findIndex(item => item.id === filteredItems[index].id);
    setSelectedImageIndex(imageIndex);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImageIndex(null);
  };

  const nextImage = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % imageItems.length);
    }
  };

  const prevImage = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(selectedImageIndex === 0 ? imageItems.length - 1 : selectedImageIndex - 1);
    }
  };

  const filteredItems = activeFilter === 'all' 
    ? mediaItems 
    : mediaItems.filter(item => item.category === activeFilter);

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
              backgroundImage: `url(${lifeGard})`
            }}
          >
            <div className="absolute inset-0 bg-accent/90 bg-gradient-to-b from-black/40 via-black/50 to-black/50"></div>
          </div>
          
          <div className="container-custom relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center space-x-2 bg-white/20 text-white px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
                <Camera className="w-4 h-4" />
                <span className="text-sm font-medium">Galerie</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-fredoka text-white mb-6">
                La vie à la crèche en images
              </h1>
              <p className="text-lg text-white/90">
                Découvrez le quotidien joyeux de nos petits rayons de soleil à travers nos photos et vidéos.
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 120" className="w-full h-20 text-background">
              <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
            </svg>
          </div>
        </section>

        {/* Filter tabs */}
        <section className="section-padding py-8 border-b border-border">
          <div className="container-custom">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveFilter(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeFilter === category.id
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery grid */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  className="group card-soft hover:scale-105 cursor-pointer animate-fade-in-up"
                  style={{animationDelay: `${index * 0.1}s`}}
                  onClick={() => item.type === 'image' && item.image ? openModal(index) : undefined}
                >
                  {/* Media content */}
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl mb-4 relative overflow-hidden">
                    {item.type === 'image' && item.image ? (
                      <>
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="text-center text-primary-foreground">
                            <div className="text-sm font-medium mb-1">{item.title}</div>
                            <div className="text-xs opacity-80">{item.description}</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {item.type === 'video' ? (
                          <div className="text-center">
                            <Play className="w-12 h-12 text-primary mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Vidéo</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Camera className="w-12 h-12 text-secondary mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Photo</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  <div>
                    <h3 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun élément trouvé pour cette catégorie.</p>
              </div>
            )}
          </div>
        </section>

        {/* Video section */}
        <section className="section-padding bg-muted/30">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-fredoka text-foreground mb-4">
                Nos vidéos
              </h2>
              <p className="text-lg text-muted-foreground">
                Plongez dans l'ambiance chaleureuse de notre crèche
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="card-soft">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Visite virtuelle de la crèche</p>
                  </div>
                </div>
                <h3 className="font-fredoka text-lg text-foreground mb-2">
                  Découvrez nos espaces
                </h3>
                <p className="text-muted-foreground text-sm">
                  Une visite complète de nos locaux et de nos différents espaces d'activités.
                </p>
              </div>

              <div className="card-soft">
                <div className="aspect-video bg-gradient-to-br from-secondary/20 to-primary/10 rounded-xl mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-secondary mx-auto mb-4" />
                    <p className="text-muted-foreground">Une journée type à la crèche</p>
                  </div>
                </div>
                <h3 className="font-fredoka text-lg text-foreground mb-2">
                  Notre quotidien
                </h3>
                <p className="text-muted-foreground text-sm">
                  Suivez une journée complète avec les enfants et découvrez notre pédagogie.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="section-padding bg-accent text-primary-foreground">
          <div className="container-custom">
            <div className="text-center max-w-2xl mx-auto">
              <Camera className="w-12 h-12 mx-auto mb-6 text-secondary" />
              <h2 className="text-3xl font-fredoka mb-4">
                Votre enfant fait partie de l'aventure
              </h2>
              <p className="text-primary-foreground/80 mb-8">
                Chaque moment passé à la crèche est précieux. Nous capturons ces instants 
                magiques pour que vous puissiez les revivre avec votre enfant.
              </p>
              <button className="btn-secondary" onClick={() => (window.location.href = '/contact')}>
                Visiter la crèche
              </button>
            </div>
          </div>
        </section>

        {/* Image Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-0">
            <div className="relative">
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation buttons */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Image display */}
              {selectedImageIndex !== null && imageItems[selectedImageIndex] && (
                <div className="relative">
                  <img
                    src={imageItems[selectedImageIndex].image}
                    alt={imageItems[selectedImageIndex].title}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                  />
                  
                  {/* Image info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 rounded-b-lg">
                    <h3 className="text-white font-fredoka text-xl mb-1">
                      {imageItems[selectedImageIndex].title}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {imageItems[selectedImageIndex].description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-white/60">
                        {selectedImageIndex + 1} / {imageItems.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;