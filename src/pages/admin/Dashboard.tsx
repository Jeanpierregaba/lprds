import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/components/admin/AdminDashboard';
import EducatorDashboard from '@/components/admin/EducatorDashboard';
import ParentDashboard from '@/components/admin/ParentDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <p className="text-lg font-semibold">Chargement de votre espace...</p>
              <p className="text-sm text-muted-foreground">Vérification de vos accès</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Accès non autorisé</CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder à cette page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!profile.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Compte désactivé</CardTitle>
            <CardDescription>
              Votre compte a été désactivé. Contactez l'administration pour plus d'informations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  switch (profile.role) {
    case 'admin':
    case 'secretary':
      return <AdminDashboard />;
    case 'educator':
      return <EducatorDashboard />;
    case 'parent':
      return <ParentDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Rôle non reconnu</CardTitle>
              <CardDescription>
                Votre rôle n'est pas configuré correctement. Contactez l'administration.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
  }
};

export default Dashboard;