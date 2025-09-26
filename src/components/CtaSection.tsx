import { Calendar, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const CtaSection = () => {
  const [ref, isVisible] = useScrollAnimation();

  return (

    <section ref={ref} className="bg-gradient-to-br from-blue-50/50 to-purple-50/30 relative overflow-hidden">
        {/* CTA */}
        <div className={`bg-accent text-center mt-16 space-y-6 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} py-12`}>
          <h3 className="text-2xl font-fredoka text-primary-foreground">
            Prêt à Commencer Votre Parcours ?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full">
              Planifier une Visite
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 rounded-full">
              En Savoir Plus
            </Button>
          </div>
        </div>
    </section>
  );
};

export default CtaSection;