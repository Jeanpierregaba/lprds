import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  section: string;
}

interface Attendance {
  id?: string;
  is_present: boolean;
  arrival_time?: string;
  departure_time?: string;
}

interface AttendanceChildCardProps {
  child: Child;
  attendance: Attendance | null;
  onMarkPresent: (childId: string) => void;
  onMarkAbsent: (childId: string) => void;
  onRecordArrival: (childId: string) => void;
  onRecordDeparture: (childId: string) => void;
  loading?: boolean;
}

export const AttendanceChildCard = ({
  child,
  attendance,
  onMarkPresent,
  onMarkAbsent,
  onRecordArrival,
  onRecordDeparture,
  loading = false,
}: AttendanceChildCardProps) => {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      'creche_etoile': 'Crèche Étoile',
      'creche_nuage': 'Crèche Nuage',
      'creche_soleil': 'Crèche Soleil TPS',
      'garderie': 'Garderie',
      'maternelle_PS1': 'Maternelle PS1',
      'maternelle_PS2': 'Maternelle PS2',
      'maternelle_MS': 'Maternelle MS',
      'maternelle_GS': 'Maternelle GS',
    };
    return labels[section] || section;
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar et Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={child.photo_url} alt={`${child.first_name} ${child.last_name}`} />
              <AvatarFallback>{getInitials(child.first_name, child.last_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {child.first_name} {child.last_name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {getSectionLabel(child.section)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {attendance?.is_present ? (
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Présent
              </Badge>
            ) : attendance?.is_present === false ? (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                Absent
              </Badge>
            ) : (
              <Badge variant="secondary">Non marqué</Badge>
            )}
          </div>

          {/* Horaires */}
          {attendance?.is_present && (
            <div className="flex flex-col gap-1 text-sm w-full sm:w-auto">
              {attendance.arrival_time && (
                <div className="flex items-center gap-1 text-green-600">
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">Arrivée: {attendance.arrival_time}</span>
                </div>
              )}
              {attendance.departure_time && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">Départ: {attendance.departure_time}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {!attendance?.is_present && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkPresent(child.id)}
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Présent
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkAbsent(child.id)}
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Absent
                </Button>
              </>
            )}
            {attendance?.is_present && !attendance.arrival_time && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onRecordArrival(child.id)}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <Clock className="w-4 h-4 mr-1" />
                Arrivée
              </Button>
            )}
            {attendance?.is_present && attendance.arrival_time && !attendance.departure_time && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onRecordDeparture(child.id)}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <Clock className="w-4 h-4 mr-1" />
                Départ
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
