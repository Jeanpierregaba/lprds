import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle, Heart, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  photo_url?: string;
  section?: string;
  allergies?: string;
  medical_info?: string;
  special_needs?: string;
}

interface GroupChildCardProps {
  child: Child;
}

export const GroupChildCard = ({ child }: GroupChildCardProps) => {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getSectionLabel = (section?: string) => {
    if (!section) return 'Non définie';
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
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Avatar et Info de base */}
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={child.photo_url} alt={`${child.first_name} ${child.last_name}`} />
              <AvatarFallback className="text-lg">
                {getInitials(child.first_name, child.last_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1">
                {child.first_name} {child.last_name}
              </h3>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {getSectionLabel(child.section)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {calculateAge(child.birth_date)} ans
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Né(e) le {format(new Date(child.birth_date), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>

          {/* Informations médicales */}
          <div className="flex-1 space-y-2">
            {child.allergies && (
              <div className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-orange-800 dark:text-orange-200">
                    Allergies
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 line-clamp-2">
                    {child.allergies}
                  </p>
                </div>
              </div>
            )}
            
            {child.medical_info && (
              <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <Heart className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    Info médicale
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 line-clamp-2">
                    {child.medical_info}
                  </p>
                </div>
              </div>
            )}

            {child.special_needs && (
              <div className="flex items-start gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md">
                <Heart className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-purple-800 dark:text-purple-200">
                    Besoins spéciaux
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 line-clamp-2">
                    {child.special_needs}
                  </p>
                </div>
              </div>
            )}

            {!child.allergies && !child.medical_info && !child.special_needs && (
              <p className="text-xs text-muted-foreground italic">
                Aucune information médicale particulière
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
