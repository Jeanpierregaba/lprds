import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Baby } from 'lucide-react';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  status: string;
  section?: string;
  photo_url?: string;
}

interface ChildCardProps {
  child: Child;
  onViewDetails: (child: Child) => void;
  calculateAge: (birthDate: string) => number;
}

export const ChildCard = ({ child, onViewDetails, calculateAge }: ChildCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-3 w-full">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <Baby className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {child.first_name} {child.last_name}
            </CardTitle>
            <CardDescription className="truncate">
              {calculateAge(child.birth_date)} ans
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
            {child.status === 'active' ? 'Actif' : 'Inactif'}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewDetails(child)}
            className="shrink-0"
          >
            Voir détails
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
