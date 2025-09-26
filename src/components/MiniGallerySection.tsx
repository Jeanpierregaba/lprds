import { Eye, Heart, Play, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useState } from 'react';
import galleryMain from '@/assets/gallery-main.jpg';
import gallery1 from '@/assets/gallery-1.jpg';
import gallery2 from '@/assets/gallery-2.jpg';
import aboutImage1 from '@/assets/about-image-1.jpg';
import aboutImage2 from '@/assets/about-image-2.jpg';
import aboutImage3 from '@/assets/about-image-3.jpg';
import heroImage from '@/assets/hero-image.jpg';
import whyChooseUsMain from '@/assets/why-choose-us-main.jpg';

const MiniGallerySection = () => {
  const [ref, isVisible] = useScrollAnimation();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const galleryItems = [
    {
      id: 1,
      category: "Activités Manuelles",
      image: galleryMain,
      icon: Heart,
      title: "Créativité",
      description: "Les enfants découvrent les couleurs et les formes"
    },
    {
      id: 2,
      category: "Jeux Extérieurs",
      image: gallery1,
      icon: Play,
      title: "Motricité",
      description: "Moment de détente et de jeu dans notre jardin"
    },
    {
      id: 3,
      category: "Éveil Musical",
      image: gallery2,
      icon: Heart,
      title: "Expression",
      description: "Découverte des sons et de la musique"
    },
    {
      id: 4,
      category: "Moments Repas",
      image: aboutImage1,
      icon: Heart,
      title: "Convivialité",
      description: "Apprentissage de l'autonomie lors des repas"
    },
    {
      id: 5,
      category: "Temps Calme",
      image: aboutImage2,
      icon: Heart,
      title: "Sérénité",
      description: "Moments de lecture et de détente"
    },
    {
      id: 6,
      category: "Apprentissages",
      image: aboutImage3,
      icon: Play,
      title: "Découverte",
      description: "Construction et développement de la créativité"
    }
  ];

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImageIndex(null);
  };

  const nextImage = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % galleryItems.length);
    }
  };

  const prevImage = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(selectedImageIndex === 0 ? galleryItems.length - 1 : selectedImageIndex - 1);
    }
  };

  return (
    <section ref={ref} className="section-padding bg-background">
      <div className="container mx-auto px-4">
        <div className={`text-center space-y-4 mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-lg font-bold text-secondary tracking-wider uppercase">
            GALERIE
          </div>
          <h2 className="text-4xl lg:text-5xl font-fredoka text-primary">
            La Vie à la Crèche
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez en images les moments de joie, d'apprentissage et de complicité qui rythment nos journées
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {galleryItems.map((item, index) => (
            <div 
              key={item.id} 
              className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${index * 150}ms` }}
              onClick={() => openModal(index)}
            >
              <div className="w-full h-full relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay avec informations */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <div className="text-white">
                    <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
                    <p className="text-white/80 text-sm">{item.category}</p>
                  </div>
                </div>
                
                {/* Overlay au hover */}
                <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Eye className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm font-medium">Voir l'image</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className={`text-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
            Voir toute la galerie
          </Button>
        </div>

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
              {selectedImageIndex !== null && galleryItems[selectedImageIndex] && (
                <div className="relative">
                  <img
                    src={galleryItems[selectedImageIndex].image}
                    alt={galleryItems[selectedImageIndex].title}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                  />
                  
                  {/* Image info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 rounded-b-lg">
                    <h3 className="text-white font-fredoka text-xl mb-1">
                      {galleryItems[selectedImageIndex].title}
                    </h3>
                    <p className="text-white/80 text-sm mb-2">
                      {galleryItems[selectedImageIndex].description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/60">
                        {galleryItems[selectedImageIndex].category}
                      </span>
                      <span className="text-xs text-white/60">
                        {selectedImageIndex + 1} / {galleryItems.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default MiniGallerySection;