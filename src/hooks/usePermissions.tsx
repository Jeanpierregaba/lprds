import { useAuth, UserRole } from './useAuth';

// Définition des permissions granulaires
export type Permission = 
  // Administration générale
  | 'admin.full_access'
  | 'admin.financial_management'
  | 'admin.staff_management'
  | 'admin.global_dashboard'
  | 'admin.system_settings'
  
  // Gestion des enfants
  | 'children.view_all'
  | 'children.view_assigned'
  | 'children.view_own'
  | 'children.create'
  | 'children.edit_all'
  | 'children.edit_assigned'
  | 'children.delete'
  
  // Gestion des présences
  | 'attendance.view_all'
  | 'attendance.view_assigned'
  | 'attendance.view_own'
  | 'attendance.manage_all'
  | 'attendance.manage_assigned'
  
  // Communication et messages
  | 'messages.view_all'
  | 'messages.send_to_all'
  | 'messages.send_to_assigned'
  | 'messages.send_to_staff'
  | 'messages.receive'
  
  // Rapports quotidiens
  | 'daily_reports.view_all'
  | 'daily_reports.view_assigned'
  | 'daily_reports.view_own'
  | 'daily_reports.create_assigned'
  | 'daily_reports.validate'
  
  // Informations médicales
  | 'medical.view_all'
  | 'medical.view_assigned'
  | 'medical.view_own'
  | 'medical.manage_all'
  | 'medical.manage_assigned'
  
  // Planning et activités
  | 'planning.view_all'
  | 'planning.manage_all'
  | 'planning.manage_assigned'
  | 'activities.view_all'
  | 'activities.view_assigned'
  | 'activities.view_own'
  | 'activities.create_assigned'
  
  // Profils et paramètres
  | 'profiles.view_all'
  | 'profiles.edit_all'
  | 'profiles.edit_own'
  | 'profiles.create';

// Définition des sous-rôles pour l'administration
export type AdminSubRole = 'directrice_generale' | 'directrice_adjointe' | 'secretaire';

// Mapping des rôles vers leurs permissions
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Accès complet pour les administrateurs (sera affiné selon le sous-rôle)
    'admin.full_access',
    'admin.financial_management',
    'admin.staff_management',
    'admin.global_dashboard',
    'admin.system_settings',
    'children.view_all',
    'children.create',
    'children.edit_all',
    'children.delete',
    'attendance.view_all',
    'attendance.manage_all',
    'messages.view_all',
    'messages.send_to_all',
    'messages.send_to_staff',
    'messages.receive',
    'daily_reports.view_all',
    'daily_reports.validate',
    'medical.view_all',
    'medical.manage_all',
    'planning.view_all',
    'planning.manage_all',
    'activities.view_all',
    'profiles.view_all',
    'profiles.edit_all',
    'profiles.create'
  ],
  
  secretary: [
    // Secrétaire : inscriptions, communication, planning (lecture/écriture)
    'admin.global_dashboard',
    'children.view_all',
    'children.create',
    'children.edit_all',
    'attendance.view_all',
    'attendance.manage_all',
    'messages.view_all',
    'messages.send_to_all',
    'messages.send_to_staff',
    'messages.receive',
    'daily_reports.view_all',
    'planning.view_all',
    'planning.manage_all',
    'activities.view_all',
    'profiles.view_all',
    'profiles.edit_all',
    'profiles.create',
    'profiles.edit_own'
  ],
  
  educator: [
    // Éducateur : accès limité à leurs groupes d'enfants assignés
    'children.view_assigned',
    'attendance.view_assigned',
    'attendance.manage_assigned',
    'messages.send_to_assigned',
    'messages.receive',
    'daily_reports.view_assigned',
    'daily_reports.create_assigned',
    'medical.view_assigned',
    'planning.manage_assigned',
    'activities.view_assigned',
    'activities.create_assigned',
    'profiles.edit_own'
  ],
  
  parent: [
    // Parent : accès strictement limité aux données de leurs propres enfants
    'children.view_own',
    'attendance.view_own',
    'messages.receive',
    'daily_reports.view_own',
    'medical.view_own',
    'activities.view_own',
    'profiles.edit_own'
  ]
};

// Permissions supplémentaires basées sur les sous-rôles d'administration
const ADMIN_SUB_ROLE_PERMISSIONS: Record<AdminSubRole, Permission[]> = {
  directrice_generale: [
    // Accès complet à toutes les fonctionnalités
    'admin.full_access',
    'admin.financial_management'
  ],
  
  directrice_adjointe: [
    // Accès complet sauf gestion financière avancée
    'admin.full_access'
    // Note: admin.financial_management est exclu
  ],
  
  secretaire: [
    // Déjà défini dans secretary role
  ]
};

export const usePermissions = () => {
  const { profile } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!profile || !profile.is_active) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[profile.role] || [];
    return rolePermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canViewChildren = (scope: 'all' | 'assigned' | 'own' = 'own'): boolean => {
    switch (scope) {
      case 'all':
        return hasPermission('children.view_all');
      case 'assigned':
        return hasPermission('children.view_assigned') || hasPermission('children.view_all');
      case 'own':
        return hasPermission('children.view_own') || hasPermission('children.view_assigned') || hasPermission('children.view_all');
      default:
        return false;
    }
  };

  const canManageAttendance = (scope: 'all' | 'assigned' = 'assigned'): boolean => {
    switch (scope) {
      case 'all':
        return hasPermission('attendance.manage_all');
      case 'assigned':
        return hasPermission('attendance.manage_assigned') || hasPermission('attendance.manage_all');
      default:
        return false;
    }
  };

  const canSendMessages = (scope: 'all' | 'assigned' | 'staff' = 'assigned'): boolean => {
    switch (scope) {
      case 'all':
        return hasPermission('messages.send_to_all');
      case 'assigned':
        return hasPermission('messages.send_to_assigned') || hasPermission('messages.send_to_all');
      case 'staff':
        return hasPermission('messages.send_to_staff') || hasPermission('messages.send_to_all');
      default:
        return false;
    }
  };

  const canViewDailyReports = (scope: 'all' | 'assigned' | 'own' = 'own'): boolean => {
    switch (scope) {
      case 'all':
        return hasPermission('daily_reports.view_all');
      case 'assigned':
        return hasPermission('daily_reports.view_assigned') || hasPermission('daily_reports.view_all');
      case 'own':
        return hasPermission('daily_reports.view_own') || hasPermission('daily_reports.view_assigned') || hasPermission('daily_reports.view_all');
      default:
        return false;
    }
  };

  const canAccessAdminDashboard = (): boolean => {
    return hasPermission('admin.global_dashboard');
  };

  const canManageStaff = (): boolean => {
    return hasPermission('admin.staff_management');
  };

  const canManageFinances = (): boolean => {
    return hasPermission('admin.financial_management');
  };

  const isAdmin = (): boolean => {
    return profile?.role === 'admin';
  };

  const isSecretary = (): boolean => {
    return profile?.role === 'secretary';
  };

  const isEducator = (): boolean => {
    return profile?.role === 'educator';
  };

  const isParent = (): boolean => {
    return profile?.role === 'parent';
  };

  const isStaff = (): boolean => {
    return ['admin', 'secretary', 'educator'].includes(profile?.role || '');
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewChildren,
    canManageAttendance,
    canSendMessages,
    canViewDailyReports,
    canAccessAdminDashboard,
    canManageStaff,
    canManageFinances,
    isAdmin,
    isSecretary,
    isEducator,
    isParent,
    isStaff,
    role: profile?.role,
    profile
  };
};