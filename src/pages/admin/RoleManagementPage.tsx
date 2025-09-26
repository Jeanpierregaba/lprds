import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard, AdminOnly, StaffOnly, AdminOrSecretary } from '@/components/PermissionGuard';
import { Users, Shield, Settings, DollarSign, Eye, EyeOff } from 'lucide-react';

const RoleManagementPage = () => {
  const { 
    role, 
    canManageStaff, 
    canManageFinances, 
    canAccessAdminDashboard,
    isAdmin,
    isSecretary,
    isEducator,
    isParent,
    profile
  } = usePermissions();

  const [showAllPermissions, setShowAllPermissions] = useState(false);

  const getRoleBadgeVariant = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return 'destructive';
      case 'secretary':
        return 'secondary';
      case 'educator':
        return 'default';
      case 'parent':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return 'Administrateur';
      case 'secretary':
        return 'Secrétaire';
      case 'educator':
        return 'Éducateur';
      case 'parent':
        return 'Parent';
      default:
        return 'Utilisateur';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Rôles et Permissions</h1>
          <p className="text-muted-foreground">
            Système de permissions hiérarchique pour la crèche Les Petits Rayons de Soleil
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAllPermissions(!showAllPermissions)}
        >
          {showAllPermissions ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Masquer les détails
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Voir tous les détails
            </>
          )}
        </Button>
      </div>

      {/* Profil utilisateur actuel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Votre Profil et Permissions
          </CardTitle>
          <CardDescription>
            Informations sur votre rôle et les permissions qui vous sont accordées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-sm text-muted-foreground">{profile?.phone}</p>
            </div>
            <Badge variant={getRoleBadgeVariant(role || '')}>
              {getRoleLabel(role || '')}
            </Badge>
          </div>

          {showAllPermissions && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Accès Dashboard</h4>
                <div className="flex items-center gap-2">
                  {canAccessAdminDashboard() ? (
                    <Badge variant="default">Autorisé</Badge>
                  ) : (
                    <Badge variant="outline">Non autorisé</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Gestion Personnel</h4>
                <div className="flex items-center gap-2">
                  {canManageStaff() ? (
                    <Badge variant="default">Autorisé</Badge>
                  ) : (
                    <Badge variant="outline">Non autorisé</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Gestion Financière</h4>
                <div className="flex items-center gap-2">
                  {canManageFinances() ? (
                    <Badge variant="default">Autorisé</Badge>
                  ) : (
                    <Badge variant="outline">Non autorisé</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Administration - Visible uniquement aux administrateurs */}
      <AdminOnly showFallback={false}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Fonctionnalités d'Administration
            </CardTitle>
            <CardDescription>
              Outils disponibles uniquement pour les administrateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PermissionGuard permission="admin.staff_management">
                <div className="p-4 border rounded-lg">
                  <Users className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-medium">Gestion du Personnel</h3>
                  <p className="text-sm text-muted-foreground">
                    Ajout, modification et suppression des comptes staff
                  </p>
                </div>
              </PermissionGuard>

              <PermissionGuard permission="admin.financial_management">
                <div className="p-4 border rounded-lg">
                  <DollarSign className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-medium">Gestion Financière</h3>
                  <p className="text-sm text-muted-foreground">
                    Facturation, paiements et rapports financiers
                  </p>
                </div>
              </PermissionGuard>
            </div>
          </CardContent>
        </Card>
      </AdminOnly>

      {/* Section Staff - Visible aux admin et secrétaires */}
      <AdminOrSecretary showFallback={false}>
        <Card>
          <CardHeader>
            <CardTitle>Fonctionnalités Staff</CardTitle>
            <CardDescription>
              Outils de gestion quotidienne pour l'équipe administrative
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium">Inscriptions</h3>
                <p className="text-sm text-muted-foreground">
                  Gestion des nouvelles inscriptions
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium">Communication</h3>
                <p className="text-sm text-muted-foreground">
                  Messages aux parents et staff
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium">Planning</h3>
                <p className="text-sm text-muted-foreground">
                  Organisation des activités
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </AdminOrSecretary>

      {/* Section Éducateurs */}
      <StaffOnly showFallback={false}>
        <Card>
          <CardHeader>
            <CardTitle>Espace Éducateurs</CardTitle>
            <CardDescription>
              Outils spécialisés pour le suivi éducatif
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {isEducator() ? (
                <p>Accès aux enfants de votre groupe, gestion des présences et communication avec les parents.</p>
              ) : (
                <p>Vous avez accès aux fonctionnalités éducatives en plus de vos permissions administratives.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </StaffOnly>

      {/* Informations sur la hiérarchie des rôles */}
      <Card>
        <CardHeader>
          <CardTitle>Hiérarchie des Rôles</CardTitle>
          <CardDescription>
            Structure des permissions dans l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="destructive">Administrateur</Badge>
              <span className="text-sm">Accès complet à toutes les fonctionnalités</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Secrétaire</Badge>
              <span className="text-sm">Gestion administrative quotidienne (sauf finances avancées)</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default">Éducateur</Badge>
              <span className="text-sm">Accès limité aux enfants assignés uniquement</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">Parent</Badge>
              <span className="text-sm">Accès strictement limité aux données de leurs enfants</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagementPage;