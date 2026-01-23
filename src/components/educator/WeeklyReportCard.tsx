import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
}

interface WeeklyReport {
  id: string;
  child_id: string;
  week_start_date: string;
  week_end_date: string;
  status: 'draft' | 'pending' | 'validated' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  child?: Child;
}

interface WeeklyReportCardProps {
  report: WeeklyReport;
  onView?: (report: WeeklyReport) => void;
  onEdit?: (report: WeeklyReport) => void;
  showActions?: boolean;
}

export const WeeklyReportCard = ({ 
  report, 
  onView, 
  onEdit,
  showActions = true 
}: WeeklyReportCardProps) => {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: {
        label: 'Brouillon',
        variant: 'secondary' as const,
        icon: FileText,
        color: 'text-gray-600'
      },
      pending: {
        label: 'En attente',
        variant: 'default' as const,
        icon: Clock,
        color: 'text-blue-600'
      },
      validated: {
        label: 'Validé',
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600'
      },
      rejected: {
        label: 'Rejeté',
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'text-red-600'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Enfant Info */}
          {report.child && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage 
                  src={report.child.photo_url} 
                  alt={`${report.child.first_name} ${report.child.last_name}`} 
                />
                <AvatarFallback>
                  {getInitials(report.child.first_name, report.child.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">
                  {report.child.first_name} {report.child.last_name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {format(new Date(report.week_start_date), 'dd MMM', { locale: fr })} - {format(new Date(report.week_end_date), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Status et Info */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(report.status)}
              {report.status === 'validated' && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                  Approuvé
                </Badge>
              )}
            </div>

            {/* Rejection Reason */}
            {report.status === 'rejected' && report.rejection_reason && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-red-800 dark:text-red-200">
                      Raison du rejet
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      {report.rejection_reason}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex flex-wrap gap-2 sm:flex-col sm:justify-center">
              {onView && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView(report)}
                  className="flex-1 sm:flex-none"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Voir
                </Button>
              )}
              {onEdit && (report.status === 'draft' || report.status === 'rejected') && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onEdit(report)}
                  className="flex-1 sm:flex-none"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
