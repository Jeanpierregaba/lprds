import { ReactNode } from 'react';
import { usePermissions, Permission } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
  role?: string[];
}

export const PermissionGuard = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  showFallback = true,
  role = []
}: PermissionGuardProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, profile } = usePermissions();

  // Admins bypass all guard checks
  if (profile?.role === 'admin') {
    return <>{children}</>;
  }

  // Vérification des rôles si spécifiés
  if (role.length > 0 && !role.includes(profile?.role || '')) {
    return showFallback ? (
      fallback || (
        <Alert variant="destructive">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
          </AlertDescription>
        </Alert>
      )
    ) : null;
  }

  // Vérification d'une permission unique
  if (permission && !hasPermission(permission)) {
    return showFallback ? (
      fallback || (
        <Alert variant="destructive">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
          </AlertDescription>
        </Alert>
      )
    ) : null;
  }

  // Vérification de permissions multiples
  if (permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasAccess) {
      return showFallback ? (
        fallback || (
          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette section.
            </AlertDescription>
          </Alert>
        )
      ) : null;
    }
  }

  return <>{children}</>;
};

// Composants spécialisés pour les rôles courants
export const AdminOnly = ({ children, fallback, showFallback = true }: Omit<PermissionGuardProps, 'role'>) => (
  <PermissionGuard role={['admin']} fallback={fallback} showFallback={showFallback}>
    {children}
  </PermissionGuard>
);

export const StaffOnly = ({ children, fallback, showFallback = true }: Omit<PermissionGuardProps, 'role'>) => (
  <PermissionGuard role={['admin', 'secretary', 'educator']} fallback={fallback} showFallback={showFallback}>
    {children}
  </PermissionGuard>
);

export const EducatorOnly = ({ children, fallback, showFallback = true }: Omit<PermissionGuardProps, 'role'>) => (
  <PermissionGuard role={['educator']} fallback={fallback} showFallback={showFallback}>
    {children}
  </PermissionGuard>
);

export const ParentOnly = ({ children, fallback, showFallback = true }: Omit<PermissionGuardProps, 'role'>) => (
  <PermissionGuard role={['parent']} fallback={fallback} showFallback={showFallback}>
    {children}
  </PermissionGuard>
);

export const AdminOrSecretary = ({ children, fallback, showFallback = true }: Omit<PermissionGuardProps, 'role'>) => (
  <PermissionGuard role={['admin', 'secretary']} fallback={fallback} showFallback={showFallback}>
    {children}
  </PermissionGuard>
);