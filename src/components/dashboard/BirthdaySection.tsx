import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cake } from 'lucide-react';
import { useMemo } from 'react';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  section?: string;
}

interface BirthdaySectionProps {
  children: Child[];
}

export const BirthdaySection = ({ children }: BirthdaySectionProps) => {
  const currentDate = useMemo(() => new Date(), []);
  const currentMonth = currentDate.getMonth();

  const birthdayChildren = useMemo(() => {
    const filtered = children.filter(child => {
      if (!child.birth_date) return false;
      const birthDate = new Date(child.birth_date);
      return birthDate.getMonth() === currentMonth;
    });

    return filtered.sort((a, b) => {
      const dayA = new Date(a.birth_date).getDate();
      const dayB = new Date(b.birth_date).getDate();
      return dayA - dayB;
    });
  }, [children, currentMonth]);

  if (birthdayChildren.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="h-5 w-5" />
          Anniversaires du Mois - {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </CardTitle>
        <CardDescription>
          {birthdayChildren.length} enfant{birthdayChildren.length > 1 ? 's' : ''} fêtent leur anniversaire ce mois-ci
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {birthdayChildren.map((child) => {
            const birthDate = new Date(child.birth_date);
            const age = currentDate.getFullYear() - birthDate.getFullYear();
            const dayOfMonth = birthDate.getDate();
            
            return (
              <div 
                key={child.id} 
                className="p-4 border rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Cake className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {child.first_name} {child.last_name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {dayOfMonth} {currentDate.toLocaleDateString('fr-FR', { month: 'long' })} - {age} ans
                    </p>
                    {child.section && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {child.section.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
