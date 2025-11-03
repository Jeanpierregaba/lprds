import { Calendar, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const CtaSection = () => {
  const [ref, isVisible] = useScrollAnimation();

  return (

    <section ref={ref} className="bg-gradient-to-br from-blue-50/50 to-purple-50/30 relative overflow-hidden">
        {/* CTA */}
        <div className={`bg-accent text-center mt-16 space-y-6 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} py-12`}>
          <h3 className="text-3xl font-fredoka text-primary-foreground">
            Prêt à Commencer Votre Parcours ?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://wa.me/22890554121"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full">Planifier une Visite</Button>
              </a>
          </div>
        </div>
    </section>
  );
};

export default CtaSection;