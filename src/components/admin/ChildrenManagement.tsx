import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Eye, Users, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Child {
  id: string;
  code_qr_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  admission_date: string;
  status: string;
  address?: string;
  photo_url?: string;
  allergies?: string;
  medical_info?: string;
  special_needs?: string;
  section?: 'creche' | 'garderie' | 'maternelle_etoile' | 'maternelle_soleil';
  group_id?: string;
  medical_info_detailed?: any;
  emergency_contacts_detailed?: any;
  dietary_restrictions?: any;
  behavioral_notes?: string;
  preferences?: string;
  administrative_documents?: any;
  medical_history?: any;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  section: string;
  type: string;
  capacity: number;
  assigned_educator_id?: string;
  assigned_educator?: {
    first_name: string;
    last_name: string;
  };
}

export default function ChildrenManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [educators, setEducators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('children');

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch children
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select(`
          *,
          groups (
            id,
            name,
            section
          )
        `);

      if (childrenError) throw childrenError;

      // Fetch groups with educator info
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          assigned_educator:profiles!fk_groups_educator (
            first_name,
            last_name
          )
        `);

      if (groupsError) throw groupsError;

      // Fetch educators
      const { data: educatorsData, error: educatorsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'educator');

      if (educatorsError) throw educatorsError;

      setChildren(childrenData || []);
      setGroups(groupsData || []);
      setEducators(educatorsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSectionLabel = (section: string) => {
    const labels = {
      'creche': 'Crèche (3-12 mois)',
      'garderie': 'Garderie (3-8 ans)',
      'maternelle_etoile': 'Maternelle Étoile (12-24 mois)',
      'maternelle_soleil': 'Maternelle Soleil (24-36 mois)'
    };
    return labels[section as keyof typeof labels] || section;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'default',
      'inactive': 'secondary',
      'suspended': 'destructive'
    };
    
    const labels = {
      'active': 'Actif',
      'inactive': 'Inactif',
      'suspended': 'Suspendu'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    
    if (months < 12) {
      return `${months} mois`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return remainingMonths > 0 ? `${years} an${years > 1 ? 's' : ''} ${remainingMonths} mois` : `${years} an${years > 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Gestion des Enfants</h2>
        {(profile?.role === 'admin' || profile?.role === 'secretary') && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Enfant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un Nouveau Profil Enfant</DialogTitle>
              </DialogHeader>
              <CreateChildForm onSuccess={() => {
                setIsCreateDialogOpen(false);
                fetchData();
              }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="children">Enfants</TabsTrigger>
          <TabsTrigger value="groups">Groupes & Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="children">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <Card key={child.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {child.first_name} {child.last_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Code: {child.code_qr_id}
                      </p>
                    </div>
                    {getStatusBadge(child.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Âge:</strong> {calculateAge(child.birth_date)}</p>
                    {child.section && (
                      <p><strong>Section:</strong> {getSectionLabel(child.section)}</p>
                    )}
                    {child.allergies && (
                      <p><strong>Allergies:</strong> {child.allergies}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedChild(child);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                    {(profile?.role === 'admin' || profile?.role === 'secretary') && (
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="groups">
          <GroupsManagement
            groups={groups}
            educators={educators}
            onRefresh={fetchData}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog de détails de l'enfant */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Fiche Détaillée - {selectedChild?.first_name} {selectedChild?.last_name}
            </DialogTitle>
          </DialogHeader>
          {selectedChild && (
            <ChildDetailView child={selectedChild} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Composant pour créer un enfant
function CreateChildForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    admission_date: '',
    address: '',
    allergies: '',
    medical_info: '',
    special_needs: '',
    section: '' as 'creche' | 'garderie' | 'maternelle_etoile' | 'maternelle_soleil' | '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('children')
        .insert([{
          ...formData,
          section: formData.section || null
        }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Enfant créé avec succès",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating child:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'enfant",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">Prénom *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="last_name">Nom *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="birth_date">Date de naissance *</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="admission_date">Date d'admission *</Label>
          <Input
            id="admission_date"
            type="date"
            value={formData.admission_date}
            onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="section">Section</Label>
        <Select
          value={formData.section}
          onValueChange={(value) => setFormData({ ...formData, section: value as any })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="creche">Crèche (3-12 mois)</SelectItem>
            <SelectItem value="garderie">Garderie (3-8 ans)</SelectItem>
            <SelectItem value="maternelle_etoile">Maternelle Étoile (12-24 mois)</SelectItem>
            <SelectItem value="maternelle_soleil">Maternelle Soleil (24-36 mois)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="address">Adresse</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="allergies">Allergies</Label>
        <Textarea
          id="allergies"
          value={formData.allergies}
          onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="medical_info">Informations médicales</Label>
        <Textarea
          id="medical_info"
          value={formData.medical_info}
          onChange={(e) => setFormData({ ...formData, medical_info: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="special_needs">Besoins spéciaux</Label>
        <Textarea
          id="special_needs"
          value={formData.special_needs}
          onChange={(e) => setFormData({ ...formData, special_needs: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full">
        Créer l'enfant
      </Button>
    </form>
  );
}

// Composant pour afficher les détails d'un enfant
function ChildDetailView({ child }: { child: Child }) {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="general">Général</TabsTrigger>
        <TabsTrigger value="medical">Médical</TabsTrigger>
        <TabsTrigger value="contacts">Contacts</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Code QR</Label>
            <p className="font-mono text-lg">{child.code_qr_id}</p>
          </div>
          <div>
            <Label>Statut</Label>
            <div className="mt-1">
              <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                {child.status === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date de naissance</Label>
            <p>{new Date(child.birth_date).toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <Label>Date d'admission</Label>
            <p>{new Date(child.admission_date).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        {child.address && (
          <div>
            <Label>Adresse</Label>
            <p>{child.address}</p>
          </div>
        )}

        {child.section && (
          <div>
            <Label>Section</Label>
            <p>{child.section}</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="medical" className="space-y-4">
        {child.allergies && (
          <div>
            <Label>Allergies</Label>
            <p className="text-red-600 font-medium">{child.allergies}</p>
          </div>
        )}
        
        {child.medical_info && (
          <div>
            <Label>Informations médicales</Label>
            <p>{child.medical_info}</p>
          </div>
        )}
        
        {child.special_needs && (
          <div>
            <Label>Besoins spéciaux</Label>
            <p>{child.special_needs}</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="contacts" className="space-y-4">
        <p className="text-muted-foreground">Contacts d'urgence et personnes autorisées</p>
        {/* À implémenter avec les données de emergency_contacts_detailed */}
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
        <p className="text-muted-foreground">Documents administratifs</p>
        {/* À implémenter avec les données de administrative_documents */}
      </TabsContent>
    </Tabs>
  );
}

// Composant pour la gestion des groupes
function GroupsManagement({ groups, educators, onRefresh }: {
  groups: Group[];
  educators: any[];
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Groupes et Sections</h3>
        <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Groupe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Groupe</DialogTitle>
            </DialogHeader>
            <CreateGroupForm
              educators={educators}
              onSuccess={() => {
                setIsCreateGroupOpen(false);
                onRefresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {group.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Section:</strong> {group.section}</p>
                <p><strong>Type:</strong> {group.type}</p>
                <p><strong>Capacité:</strong> {group.capacity} enfants</p>
                {group.assigned_educator && (
                  <p><strong>Éducateur:</strong> {group.assigned_educator.first_name} {group.assigned_educator.last_name}</p>
                )}
                {group.description && (
                  <p><strong>Description:</strong> {group.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Composant pour créer un groupe
function CreateGroupForm({ educators, onSuccess }: {
  educators: any[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    section: '' as 'creche' | 'garderie' | 'maternelle_etoile' | 'maternelle_soleil' | '',
    type: 'mixed_group' as 'age_group' | 'mixed_group' | 'class',
    capacity: 15,
    assigned_educator_id: '',
    age_min_months: '',
    age_max_months: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('groups')
        .insert([{
          name: formData.name,
          description: formData.description || null,
          section: formData.section as 'creche' | 'garderie' | 'maternelle_etoile' | 'maternelle_soleil',
          type: formData.type,
          capacity: formData.capacity,
          age_min_months: formData.age_min_months ? parseInt(formData.age_min_months) : null,
          age_max_months: formData.age_max_months ? parseInt(formData.age_max_months) : null,
          assigned_educator_id: formData.assigned_educator_id || null,
        }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Groupe créé avec succès",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le groupe",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nom du groupe *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="section">Section *</Label>
        <Select
          value={formData.section}
          onValueChange={(value) => setFormData({ ...formData, section: value as any })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="creche">Crèche</SelectItem>
            <SelectItem value="garderie">Garderie</SelectItem>
            <SelectItem value="maternelle_etoile">Maternelle Étoile</SelectItem>
            <SelectItem value="maternelle_soleil">Maternelle Soleil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="type">Type de groupe</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="age_group">Groupe d'âge</SelectItem>
            <SelectItem value="mixed_group">Groupe mixte</SelectItem>
            <SelectItem value="class">Classe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="capacity">Capacité</Label>
        <Input
          id="capacity"
          type="number"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
          min="1"
          max="30"
        />
      </div>

      <div>
        <Label htmlFor="assigned_educator_id">Éducateur assigné</Label>
        <Select
          value={formData.assigned_educator_id}
          onValueChange={(value) => setFormData({ ...formData, assigned_educator_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un éducateur" />
          </SelectTrigger>
          <SelectContent>
            {educators.map((educator) => (
              <SelectItem key={educator.id} value={educator.id}>
                {educator.first_name} {educator.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="age_min_months">Âge min (mois)</Label>
          <Input
            id="age_min_months"
            type="number"
            value={formData.age_min_months}
            onChange={(e) => setFormData({ ...formData, age_min_months: e.target.value })}
            min="0"
            max="120"
          />
        </div>
        <div>
          <Label htmlFor="age_max_months">Âge max (mois)</Label>
          <Input
            id="age_max_months"
            type="number"
            value={formData.age_max_months}
            onChange={(e) => setFormData({ ...formData, age_max_months: e.target.value })}
            min="0"
            max="120"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full">
        Créer le groupe
      </Button>
    </form>
  );
}