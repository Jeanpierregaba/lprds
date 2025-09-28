import { ParentOnly } from '@/components/PermissionGuard';
import DailyReportsViewer from '@/components/parent/DailyReportsViewer';

const ParentDailyReportsPage = () => {
  return (
    <ParentOnly
      fallback={
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Accès non autorisé</h2>
          <p className="text-muted-foreground">
            Cette section est réservée aux parents.
          </p>
        </div>
      }
    >
      <DailyReportsViewer />
    </ParentOnly>
  );
};

export default ParentDailyReportsPage;