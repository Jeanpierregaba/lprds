import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Baby, User, AlertCircle, Stethoscope, Heart } from 'lucide-react';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  status: string;
  admission_date?: string;
  medical_info?: string;
  allergies?: string;
  special_needs?: string;
  section?: string;
  photo_url?: string;
}

interface ChildDetailsDialogProps {
  child: Child | null;
  isOpen: boolean;
  onClose: () => void;
  calculateAge: (birthDate: string) => number;
  getSectionLabel: (section?: string) => string;
}

export const ChildDetailsDialog = ({
  child,
  isOpen,
  onClose,
  calculateAge,
  getSectionLabel
}: ChildDetailsDialogProps) => {
  if (!child) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Baby className="w-6 h-6 text-primary" />
            {child.first_name} {child.last_name}
          </DialogTitle>
          <DialogDescription>
            Informations détaillées sur votre enfant
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Informations générales */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations générales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prénom</p>
                <p className="text-sm font-semibold">{child.first_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nom</p>
                <p className="text-sm font-semibold">{child.last_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date de naissance</p>
                <p className="text-sm font-semibold">
                  {new Date(child.birth_date).toLocaleDateString('fr-FR')}
                  {' '}({calculateAge(child.birth_date)} ans)
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date d'admission</p>
                <p className="text-sm font-semibold">
                  {child.admission_date 
                    ? new Date(child.admission_date).toLocaleDateString('fr-FR')
                    : 'Non renseignée'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Section</p>
                <p className="text-sm font-semibold">{getSectionLabel(child.section)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Statut</p>
                <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                  {child.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Informations médicales */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Informations médicales
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Informations médicales</p>
                <p className="text-sm bg-muted p-3 rounded-md">
                  {child.medical_info || 'Aucune information médicale renseignée'}
                </p>
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Allergies
            </h3>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 rounded-md">
              <p className="text-sm">
                {child.allergies || 'Aucune allergie connue'}
              </p>
            </div>
          </div>

          {/* Besoins spéciaux */}
          {child.special_needs && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-blue-500" />
                Besoins spéciaux
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
                <p className="text-sm">{child.special_needs}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
