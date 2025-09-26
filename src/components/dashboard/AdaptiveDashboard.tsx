import { usePermissions } from '@/hooks/usePermissions';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { EducatorDashboard } from '@/components/dashboard/EducatorDashboard';
import { ParentDashboard } from '@/components/dashboard/ParentDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export const AdaptiveDashboard = () => {
  const { isAdmin, isSecretary, isEducator, isParent, role } = usePermissions();

  // Dashboard pour les administrateurs et secrétaires
  if (isAdmin() || isSecretary()) {
    return <AdminDashboard />;
  }

  // Dashboard pour les éducateurs
  if (isEducator()) {
    return <EducatorDashboard />;
  }

  // Dashboard pour les parents
  if (isParent()) {
    return <ParentDashboard />;
  }

  // Fallback pour rôles non reconnus
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Dashboard Non Disponible
          </CardTitle>
          <CardDescription>
            Aucun dashboard spécialisé n'est configuré pour votre rôle : {role}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Veuillez contacter l'administrateur pour configurer votre accès au système.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};