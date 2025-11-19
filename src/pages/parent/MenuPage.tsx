import WeeklyMenuViewer from '@/components/parent/WeeklyMenuViewer';
import { UtensilsCrossed } from 'lucide-react';

export default function MenuPage() {
  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-primary text-2xl lg:text-3xl font-bold text-foreground">Menus de la Semaine</h1>
          <p className="text-sm text-muted-foreground">
            Consultez les repas prévus pour vos enfants
          </p>
        </div>
      </div>

      <WeeklyMenuViewer />
    </div>
  );
}
