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
  QrCode,
  UtensilsCrossed,
  Image as ImageIcon
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

    // Fonctionnalités communes admin
    adminNav.push(
      {
        title: "Enfants", 
        url: "/admin/dashboard/children", 
        icon: Baby 
      },
      { 
        title: "Parents", 
        url: "/admin/dashboard/parents", 
        icon: Users 
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
        title: "Menus", 
        url: "/admin/dashboard/menus", 
        icon: UtensilsCrossed 
      },
      { 
        title: "Galerie", 
        url: "/admin/dashboard/gallery", 
        icon: ImageIcon 
      },
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
        title: "Menus",
        url: "/admin/dashboard/menus",
        icon: UtensilsCrossed
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
        title: "Menus", 
        url: "/educator/dashboard/menus", 
        icon: UtensilsCrossed 
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
      //{ 
       // title: "Présences", 
       // url: "/parent/dashboard/attendance", 
       // icon: Clock 
      //},
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
        title: "Menus", 
        url: "/parent/dashboard/menus", 
        icon: UtensilsCrossed 
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