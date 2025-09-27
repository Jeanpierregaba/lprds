import { usePermissions } from '@/hooks/usePermissions';
import { 
  Users, 
  Baby, 
  Clock, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  FileText, 
  User,
  Heart,
  Calendar,
  Shield,
  DollarSign,
  QrCode
} from 'lucide-react';

export interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  exact?: boolean;
  badge?: string;
  children?: NavigationItem[];
}

export const useRoleBasedNavigation = (): NavigationItem[] => {
  const { 
    canAccessAdminDashboard, 
    canManageStaff, 
    canManageFinances,
    canViewChildren,
    canManageAttendance,
    canSendMessages,
    canViewDailyReports,
    isAdmin,
    isSecretary,
    isEducator,
    isParent
  } = usePermissions();

  // Navigation pour les administrateurs
  if (isAdmin()) {
    const adminNav: NavigationItem[] = [
      { 
        title: "Tableau de Bord", 
        url: "/admin/dashboard", 
        icon: BarChart3,
        exact: true
      }
    ];

    // Gestion financière uniquement pour directrice générale
    if (canManageFinances()) {
      adminNav.push({
        title: "Gestion Financière",
        url: "/admin/dashboard/finances",
        icon: DollarSign
      });
    }

    // Fonctionnalités communes admin
    adminNav.push(
      { 
        title: "Enfants", 
        url: "/admin/dashboard/children", 
        icon: Baby 
      },
      { 
        title: "Personnel", 
        url: "/admin/dashboard/staff", 
        icon: Users 
      },
      { 
        title: "Présences", 
        url: "/admin/dashboard/attendance", 
        icon: Clock 
      },
      { 
        title: "Scanner QR", 
        url: "/admin/dashboard/qr-scanner", 
        icon: QrCode 
      },
      { 
        title: "Suivi Quotidien", 
        url: "/admin/dashboard/daily-reports", 
        icon: FileText 
      },
      { 
        title: "Messages", 
        url: "/admin/dashboard/messages", 
        icon: MessageSquare 
      },
      { 
        title: "Planning", 
        url: "/admin/dashboard/planning", 
        icon: Calendar 
      },
      { 
        title: "Paramètres", 
        url: "/admin/dashboard/settings", 
        icon: Settings 
      }
    );

    return adminNav;
  }

  // Navigation pour les secrétaires
  if (isSecretary()) {
    return [
      { 
        title: "Tableau de Bord", 
        url: "/admin/dashboard", 
        icon: BarChart3,
        exact: true
      },
      { 
        title: "Enfants", 
        url: "/admin/dashboard/children", 
        icon: Baby 
      },
      { 
        title: "Présences", 
        url: "/admin/dashboard/attendance", 
        icon: Clock 
      },
      { 
        title: "Scanner QR", 
        url: "/admin/dashboard/qr-scanner", 
        icon: QrCode 
      },
      { 
        title: "Suivi Quotidien", 
        url: "/admin/dashboard/daily-reports", 
        icon: FileText 
      },
      { 
        title: "Messages", 
        url: "/admin/dashboard/messages", 
        icon: MessageSquare 
      },
      { 
        title: "Planning", 
        url: "/admin/dashboard/planning", 
        icon: Calendar 
      },
      { 
        title: "Profil", 
        url: "/admin/dashboard/profile", 
        icon: User 
      }
    ];
  }

  // Navigation pour les éducateurs
  if (isEducator()) {
    return [
      { 
        title: "Mon Groupe", 
        url: "/educator/dashboard", 
        icon: Baby,
        exact: true
      },
      { 
        title: "Présences", 
        url: "/educator/dashboard/attendance", 
        icon: Clock 
      },
      { 
        title: "Suivi Quotidien", 
        url: "/educator/dashboard/daily-reports", 
        icon: FileText 
      },
      { 
        title: "Activités", 
        url: "/educator/dashboard/activities", 
        icon: Heart 
      },
      { 
        title: "Messages", 
        url: "/educator/dashboard/messages", 
        icon: MessageSquare 
      },
      { 
        title: "Planning", 
        url: "/educator/dashboard/planning", 
        icon: Calendar 
      },
      { 
        title: "Mon Profil", 
        url: "/educator/dashboard/profile", 
        icon: User 
      }
    ];
  }

  // Navigation pour les parents
  if (isParent()) {
    return [
      { 
        title: "Mes Enfants", 
        url: "/parent/dashboard", 
        icon: Baby,
        exact: true
      },
      { 
        title: "Présences", 
        url: "/parent/dashboard/attendance", 
        icon: Clock 
      },
      { 
        title: "Suivi Quotidien", 
        url: "/parent/dashboard/daily-reports", 
        icon: FileText 
      },
      { 
        title: "Activités", 
        url: "/parent/dashboard/activities", 
        icon: Heart 
      },
      { 
        title: "Messages", 
        url: "/parent/dashboard/messages", 
        icon: MessageSquare 
      },
      { 
        title: "Informations Médicales", 
        url: "/parent/dashboard/medical", 
        icon: Shield 
      },
      { 
        title: "Mon Profil", 
        url: "/parent/dashboard/profile", 
        icon: User 
      }
    ];
  }

  // Fallback - navigation vide
  return [];
};