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
import { Plus, Edit, Eye, Users, FileText, UserCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import ChildDetailView from './children/ChildDetailView';
import CreateChildForm from '@/components/admin/children/CreateChildForm';
import EditChildForm from '@/components/admin/children/EditChildForm';
import { QRCodeGeneratorTrigger } from './children/QRCodeGenerator';
import ParentChildAssignment from './children/ParentChildAssignment';

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
  section?: 'creche_etoile' | 'creche_nuage' | 'creche_soleil' | 'garderie' | 'maternelle_PS1' | 'maternelle_PS2' | 'maternelle_MS' | null;
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('children');
  // Nouveaux états: filtre et tri
  const [sectionFilter, setSectionFilter] = useState<'all' | 'creche_etoile' | 'creche_nuage' | 'creche_soleil' | 'garderie' | 'maternelle_PS1' | 'maternelle_PS2' | 'maternelle_MS'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'admission' | 'section'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

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

      // Fix: Map childrenData to match Child type, especially for 'section' property
      setChildren(
        (childrenData || []).map((child) => ({
          ...child,
          // Map group section if present
          groups: child.groups
            ? {
                ...child.groups,
                section: child.groups.section
              }
            : undefined,
          // Map section to new values using our mapping function
          section: mapSectionValue(child.section) as 'creche_etoile' | 'creche_nuage' | 'creche_soleil' | 'garderie' | 'maternelle_PS1' | 'maternelle_PS2' | 'maternelle_MS' | null
        }))
      );
      setGroups(groupsData || []);
      setEducators(educatorsData || []);
    } catch (error: any) {
      console.error('Error loading children data:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSectionLabel = (section: string) => {
    const labels = {
      'creche_etoile': 'Crèche Étoile (3-18 mois)',
      'creche_nuage': 'Crèche Nuage (18-24 mois)',
      'creche_soleil': 'Crèche Soleil TPS (24-36 mois)',
      'garderie': 'Garderie (3-8 ans)',
      'maternelle_PS1': 'Maternelle Petite Section 1',
      'maternelle_PS2': 'Maternelle Petite Section 2',
      'maternelle_MS': 'Maternelle Moyenne Section'
    };
    return labels[section as keyof typeof labels] || section;
  };

  // Fonction pour mapper les anciennes valeurs de section vers les nouvelles
  const mapSectionValue = (section: string | null): 'creche_etoile' | 'creche_nuage' | 'creche_soleil' | 'garderie' | 'maternelle_PS1' | 'maternelle_PS2' | 'maternelle_MS' | null => {
    if (!section) return null;
    const mapping: Record<string, 'creche_etoile' | 'creche_nuage' | 'creche_soleil' | 'garderie' | 'maternelle_PS1' | 'maternelle_PS2' | 'maternelle_MS'> = {
      'creche': 'creche_etoile',
      'garderie': 'garderie',
      'maternelle_etoile': 'maternelle_PS1',
      'maternelle_soleil': 'maternelle_PS2'
    };
    return mapping[section] || (section as any);
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

  const getAgeMonths = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    return (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  };

  const filteredAndSortedChildren = (() => {
    const filtered = children.filter((c) => {
      // Filtre par section
      const sectionMatch = sectionFilter === 'all' ? true : c.section === sectionFilter;
      
      // Filtre par recherche (nom ou prénom)
      const searchMatch = searchQuery === '' || 
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.last_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return sectionMatch && searchMatch;
    });
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': {
          const an = `${a.first_name} ${a.last_name}`.toLowerCase();
          const bn = `${b.first_name} ${b.last_name}`.toLowerCase();
          cmp = an.localeCompare(bn);
          break;
        }
        case 'age': {
          // plus d'âge en premier si desc, sinon plus jeune
          cmp = getAgeMonths(a.birth_date) - getAgeMonths(b.birth_date);
          break;
        }
        case 'admission': {
          cmp = new Date(a.admission_date).getTime() - new Date(b.admission_date).getTime();
          break;
        }
        case 'section': {
          const as = (a.section || '').toString();
          const bs = (b.section || '').toString();
          cmp = as.localeCompare(bs);
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  })();

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
          <TabsTrigger value="parents">
            <UserCircle className="w-4 h-4 mr-1" />
            Parents-Enfants
          </TabsTrigger>
        </TabsList>

        <TabsContent value="children">
          {/* Barre de filtres et tri (déplacée ici) */}
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div>
              <Label>Rechercher un enfant</Label>
              <Input
                placeholder="Nom ou prénom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            <div>
              <Label>Filtrer par section</Label>
              <Select value={sectionFilter} onValueChange={(v) => setSectionFilter(v as any)}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Toutes les sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sections</SelectItem>
                  <SelectItem value="creche_etoile">Crèche Étoile</SelectItem>
                  <SelectItem value="creche_nuage">Crèche Nuage</SelectItem>
                  <SelectItem value="creche_soleil">Crèche Soleil TPS</SelectItem>
                  <SelectItem value="garderie">Garderie</SelectItem>
                  <SelectItem value="maternelle_PS1">Maternelle PS1</SelectItem>
                  <SelectItem value="maternelle_PS2">Maternelle PS2</SelectItem>
                  <SelectItem value="maternelle_MS">Maternelle MS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trier par</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="age">Âge</SelectItem>
                  <SelectItem value="admission">Date d'admission</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Direction</Label>
              <Select value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascendant</SelectItem>
                  <SelectItem value="desc">Descendant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedChildren.map((child) => (
              <Card key={child.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {child.first_name} {child.last_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const raw = (child.code_qr_id || '').toString();
                          const stripped = raw.replace(/^LPRDS-/, '');
                          const token = stripped.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
                          return `Code: LPRDS-${token}`;
                        })()}
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
                  
                  <div className="flex flex-wrap gap-2 mt-4">
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
                      <>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedChild(child); setIsEditDialogOpen(true); }}>
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                        <QRCodeGeneratorTrigger child={child} />
                      </>
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
            children={children}
            onRefresh={fetchData}
          />
        </TabsContent>

        <TabsContent value="parents">
          <ParentChildAssignment />
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
            <ChildDetailView child={selectedChild as any} />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition de l'enfant */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Modifier - {selectedChild?.first_name} {selectedChild?.last_name}
            </DialogTitle>
          </DialogHeader>
          {selectedChild && (
            <EditChildForm
              child={selectedChild as any}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                fetchData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// (Ancien formulaire de création supprimé au profit de CreateChildForm dédié)

// Composant pour afficher les détails d'un enfant - Déplacé vers children/ChildDetailView.tsx

// Composant pour la gestion des groupes
function GroupsManagement({ groups, educators, children, onRefresh }: {
  groups: Group[];
  educators: any[];
  children: Child[];
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [selectedSectionForView, setSelectedSectionForView] = useState<string | null>(null);

  // Process sections data with real child counts
  const getSectionLabel = (section: string) => {
    const labels = {
      'creche_etoile': 'Crèche Étoile',
      'creche_nuage': 'Crèche Nuage',
      'creche_soleil': 'Crèche Soleil TPS',
      'garderie': 'Garderie',
      'maternelle_PS1': 'Maternelle Petite Section 1',
      'maternelle_PS2': 'Maternelle Petite Section 2',
      'maternelle_MS': 'Maternelle Moyenne Section'
    };
    return labels[section as keyof typeof labels] || section;
  };

  const getAgeRange = (section: string) => {
    const ranges = {
      'creche_etoile': '3-18 mois',
      'creche_nuage': '18-24 mois',
      'creche_soleil': '24-36 mois',
      'garderie': '3-8 ans',
      'maternelle_PS1': '3-4 ans',
      'maternelle_PS2': '4-5 ans',
      'maternelle_MS': '5-6 ans'
    };
    return ranges[section as keyof typeof ranges] || '';
  };

  const sectionConfigs = [
    { id: 'creche_etoile', name: 'creche_etoile' },
    { id: 'creche_nuage', name: 'creche_nuage' },
    { id: 'creche_soleil', name: 'creche_soleil' },
    { id: 'garderie', name: 'garderie' },
    { id: 'maternelle_PS1', name: 'maternelle_PS1' },
    { id: 'maternelle_PS2', name: 'maternelle_PS2' },
    { id: 'maternelle_MS', name: 'maternelle_MS' }
  ];

  // Map old DB sections to new ones
  const mapDbSectionToNew = (dbSection: string): string => {
    const mapping: Record<string, string> = {
      'creche': 'creche_etoile',
      'maternelle_etoile': 'maternelle_PS1',
      'maternelle_soleil': 'maternelle_PS2',
      'garderie': 'garderie'
    };
    return mapping[dbSection] || dbSection;
  };

  const sectionsData = sectionConfigs.map(config => {
    // Find groups that belong to this section (considering DB mapping)
    const sectionGroups = groups.filter(group => {
      const mappedSection = mapDbSectionToNew(group.section);
      return mappedSection === config.name;
    }).map(group => {
      const groupChildren = children.filter(child => child.group_id === group.id);
      return {
        ...group,
        children: groupChildren,
        children_count: groupChildren.length
      };
    });

    // Also count children directly assigned to this section (not just through groups)
    const directSectionChildren = children.filter(child => child.section === config.name);
    const totalChildren = directSectionChildren.length;
    const totalCapacity = sectionGroups.reduce((sum, group) => sum + group.capacity, 0);

    return {
      id: config.id,
      name: config.name,
      label: getSectionLabel(config.name),
      ageRange: getAgeRange(config.name),
      groups: sectionGroups,
      allSectionChildren: directSectionChildren.sort((a, b) => 
        `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
      ),
      totalChildren,
      totalCapacity
    };
  });

  return (
    <div className="space-y-6">
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

      {/* Vue par sections */}
      <div className="space-y-6">
        {sectionsData.map((section) => (
          <Card key={section.id}>
            <CardHeader 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedSectionForView(
                selectedSectionForView === section.id ? null : section.id
              )}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  <div>
                    <h3>{section.label}</h3>
                    <p className="text-sm font-normal text-muted-foreground">{section.ageRange}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline">
                    {section.totalChildren} {section.totalChildren > 1 ? 'enfants' : 'enfant'}
                  </Badge>
                  {section.totalCapacity > 0 && (
                    <>
                      <span className="text-muted-foreground">sur {section.totalCapacity}</span>
                      <Progress 
                        value={(section.totalChildren / section.totalCapacity) * 100} 
                        className="w-24"
                      />
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Liste alphabétique des enfants (affichée au clic) */}
              {selectedSectionForView === section.id && (
                <div className="mb-6 p-4 bg-accent/20 rounded-lg border-2 border-primary">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Liste des enfants de {section.label} ({section.allSectionChildren.length})
                  </h4>
                  {section.allSectionChildren.length > 0 ? (
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {section.allSectionChildren.map((child) => (
                        <div key={child.id} className="text-sm p-2 bg-background rounded border">
                          <p className="font-medium">
                            {child.last_name} {child.first_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Code: {child.code_qr_id}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun enfant dans cette section</p>
                  )}
                </div>
              )}

              {/* Vue des groupes */}
              {section.groups.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {section.groups.map((group) => (
                    <Card key={group.id} className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          {group.name}
                          <Badge 
                            variant={group.children_count >= group.capacity ? "destructive" : "default"}
                          >
                            {group.children_count}/{group.capacity}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {group.assigned_educator ? (
                          <p className="text-sm">
                            <strong>Éducateur:</strong> {group.assigned_educator.first_name} {group.assigned_educator.last_name}
                          </p>
                        ) : (
                          <p className="text-sm text-destructive">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            Aucun éducateur assigné
                          </p>
                        )}
                        
                        {group.children.length > 0 ? (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Enfants:</p>
                            {group.children.slice(0, 3).map((child) => (
                              <p key={child.id} className="text-xs">
                                {child.first_name} {child.last_name}
                              </p>
                            ))}
                            {group.children.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{group.children.length - 3} autres...
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucun enfant assigné</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun groupe créé pour cette section
                </p>
              )}
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
    section: '' as 'creche_etoile' | 'creche_nuage' | 'creche_soleil' | 'garderie' | 'maternelle_PS1' | 'maternelle_PS2' | 'maternelle_MS' | '',
    type: 'mixed_group' as 'age_group' | 'mixed_group' | 'class',
    capacity: 15,
    assigned_educator_id: '',
    age_min_months: '',
    age_max_months: '',
  });

  // Map UI section values to current DB enum values
  const mapSectionForDB = (
    section: 'creche_etoile' | 'creche_nuage' | 'creche_soleil' | 'garderie' | 'maternelle_PS1' | 'maternelle_PS2' | 'maternelle_MS' | ''
  ): 'garderie' | 'creche' | 'maternelle_etoile' | 'maternelle_soleil' => {
    switch (section) {
      case 'creche_etoile':
      case 'creche_nuage':
      case 'creche_soleil':
        return 'creche';
      case 'maternelle_PS1':
        return 'maternelle_etoile';
      case 'maternelle_PS2':
      case 'maternelle_MS':
        return 'maternelle_soleil';
      case 'garderie':
        return 'garderie';
      default:
        return 'garderie';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!formData.name || !formData.section) {
        toast({
          title: 'Section requise',
          description: 'Veuillez sélectionner une section.',
          variant: 'destructive',
        });
        return;
      }

      const dbSection = mapSectionForDB(formData.section);

      const { error } = await supabase
        .from('groups')
        .insert([{
          name: formData.name,
          description: formData.description || null,
          section: dbSection,
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
          className="border-accent focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
          required
        />
      </div>

      <div>
        <Label htmlFor="section">Section *</Label>
        <Select
          value={formData.section}
          onValueChange={(value) => setFormData({ ...formData, section: value as any })}
        >
          <SelectTrigger className="border-accent focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500">
            <SelectValue placeholder="Sélectionner une section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="creche_etoile">Crèche Étoile</SelectItem>
            <SelectItem value="creche_nuage">Crèche Nuage</SelectItem>
            <SelectItem value="creche_soleil">Crèche Soleil TPS</SelectItem>
            <SelectItem value="garderie">Garderie</SelectItem>
            <SelectItem value="maternelle_PS1">Maternelle Petite Section 1</SelectItem>
            <SelectItem value="maternelle_PS2">Maternelle Petite Section 2</SelectItem>
            <SelectItem value="maternelle_MS">Maternelle Moyenne Section</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="type">Type de groupe</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as any })}
        >
          <SelectTrigger className="border-accent focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500">
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
          className="border-accent focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
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
          <SelectTrigger className="border-accent focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500">
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
          className="border-accent focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
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
          className="border-accent focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
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
          className="border-accent focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
        />
      </div>

      <Button type="submit" className="w-full hover:bg-accent">
        Créer le groupe
      </Button>
    </form>
  );
}