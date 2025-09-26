import { Star, Quote, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const Testimonials = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [ref, isVisible] = useScrollAnimation();
  
  const testimonials = [
    {
      name: "Marie Dubois",
      child: "Emma, 2 ans",
      rating: 5,
      text: "Une équipe exceptionnelle qui prend soin de notre fille comme si c'était la leur. Emma s'épanouit chaque jour un peu plus !",
      image: "M"
    },
    {
      name: "Pierre Martin",
      child: "Lucas, 18 mois",
      rating: 5,
      text: "Les activités proposées sont variées et adaptées. Lucas a développé sa motricité et sa socialisation de manière remarquable.",
      image: "P"
    },
    {
      name: "Sophie Leroy",
      child: "Nina, 3 ans",
      rating: 5,
      text: "Un environnement bienveillant où les enfants apprennent en s'amusant. Nina était prête pour l'école maternelle !",
      image: "S"
    },
    {
      name: "Thomas Garcia",
      child: "Jules, 15 mois",
      rating: 5,
      text: "La communication avec l'équipe est excellente. Nous sommes toujours informés des progrès et des activités de Jules.",
      image: "T"
    },
    {
      name: "Amélie Rousseau",
      child: "Léa, 2.5 ans",
      rating: 5,
      text: "Léa adore aller à la crèche ! Les éducatrices sont formidables et l'environnement est parfait pour son développement.",
      image: "A"
    },
    {
      name: "David Chen",
      child: "Tom, 20 mois",
      rating: 5,
      text: "Tom a fait énormément de progrès depuis qu'il est aux Petits Rayons de Soleil. L'équipe est vraiment à l'écoute.",
      image: "D"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(testimonials.length / 3));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(testimonials.length / 3)) % Math.ceil(testimonials.length / 3));
  };

  const getVisibleTestimonials = () => {
    const startIndex = currentSlide * 3;
    return testimonials.slice(startIndex, startIndex + 3);
  };

  return (
    <section ref={ref} className="section-padding bg-muted">
      <div className="container mx-auto px-4">
        <div className={`text-center space-y-4 mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-lg font-bold text-secondary tracking-wider uppercase">
            TÉMOIGNAGES
          </div>
          <h2 className="text-4xl lg:text-5xl font-fredoka text-primary">
            Témoignages Parents
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ce que pensent les familles qui nous font confiance
          </p>
        </div>
        
        {/* Carousel de témoignages */}
        <div className="relative mb-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getVisibleTestimonials().map((testimonial, index) => (
              <div 
                key={currentSlide * 3 + index} 
                className={`card-soft bg-white group hover:scale-105 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Quote className="w-8 h-8 text-accent opacity-20" />
                    <div className="flex space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground italic leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  
                  <div className="flex items-center space-x-3 pt-4 border-t border-border">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">{testimonial.image}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-primary">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.child}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Navigation du carousel */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="w-10 h-10 rounded-full border-primary/20 hover:bg-primary/10"
            >
              <ChevronLeft className="w-4 h-4 text-primary" />
            </Button>
            
            <div className="flex space-x-2">
              {Array.from({ length: Math.ceil(testimonials.length / 3) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentSlide === index ? 'bg-primary' : 'bg-primary/20'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="w-10 h-10 rounded-full border-primary/20 hover:bg-primary/10"
            >
              <ChevronRight className="w-4 h-4 text-primary" />
            </Button>
          </div>
        </div>
        
        {/* Statistiques de satisfaction */}
        <div className={`bg-white rounded-3xl p-8 card-soft transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <Star className="w-6 h-6 fill-accent text-accent" />
                <span className="text-3xl font-bold text-primary">4.9</span>
              </div>
              <div className="text-sm text-muted-foreground">Note moyenne</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <Heart className="w-6 h-6 text-secondary" />
                <span className="text-3xl font-bold text-primary">98%</span>
              </div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <Quote className="w-6 h-6 text-accent" />
                <span className="text-3xl font-bold text-primary">150+</span>
              </div>
              <div className="text-sm text-muted-foreground">Avis positifs</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;