import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Heart, UserX, Users } from 'lucide-react';

export interface Alert {
  id: string;
  type: 'medical' | 'absence' | 'ratio' | 'other';
  message: string;
  severity: 'high' | 'medium' | 'low';
}

interface AlertsSectionProps {
  alerts: Alert[];
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'medical': return <Heart className="h-4 w-4" />;
    case 'absence': return <UserX className="h-4 w-4" />;
    case 'ratio': return <Users className="h-4 w-4" />;
    default: return <AlertTriangle className="h-4 w-4" />;
  }
};

const getAlertVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (severity) {
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    default: return 'outline';
  }
};

export const AlertsSection = ({ alerts }: AlertsSectionProps) => {
  if (alerts.length === 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
          <AlertTriangle className="h-5 w-5" />
          Alertes Importantes ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id} 
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-background rounded-lg border gap-2 sm:gap-3 transition-all hover:shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {getAlertIcon(alert.type)}
              <span className="text-sm break-words">{alert.message}</span>
            </div>
            <Badge variant={getAlertVariant(alert.severity)} className="self-start sm:self-center shrink-0">
              {alert.severity === 'high' ? 'Urgent' : alert.severity === 'medium' ? 'Attention' : 'Info'}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
