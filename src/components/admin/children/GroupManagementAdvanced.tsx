import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Users, UserPlus, AlertTriangle, CheckCircle, ArrowRight, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  section?: string;
  group_id?: string;
  status: string;
}

interface Group {
  id: string;
  name: string;
  section: string;
  type: string;
  capacity: number;
  age_min_months?: number;
  age_max_months?: number;
  assigned_educator?: {
    first_name: string;
    last_name: string;
  };
  children_count: number;
  children: Child[];
}

interface Section {
  id: string;
  name: string;
  label: string;
  ageRange: string;
  groups: Group[];
  totalChildren: number;
  totalCapacity: number;
  ratioRequired: number; // Nombre d'enfants par éducateur selon réglementation
}

export default function GroupManagementAdvanced() {
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [unassignedChildren, setUnassignedChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [targetGroup, setTargetGroup] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all children with their group info
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select(`
          *,
          groups!left (
            id,
            name,
            section
          )
        `)
        .eq('status', 'active');

      if (childrenError) throw childrenError;

      // Fetch all groups with educator info
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

      // Process data into sections
      const sectionsData = processSectionsData(childrenData || [], groupsData || []);
      const unassigned = (childrenData || []).filter(child => !child.group_id);

      setSections(sectionsData);
      setUnassignedChildren(unassigned);
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

  const processSectionsData = (children: any[], groups: any[]): Section[] => {
    const sectionConfigs = [
      { 
        id: 'creche_etoile', 
        name: 'creche_etoile', 
        label: 'Crèche Étoile', 
        ageRange: '3-18 mois',
        ratioRequired: 5 // 1 éducateur pour 5 bébés
      },
      { 
        id: 'creche_nuage', 
        name: 'creche_nuage', 
        label: 'Crèche Nuage', 
        ageRange: '18-24 mois',
        ratioRequired: 8 // 1 éducateur pour 8 enfants
      },
      { 
        id: 'creche_soleil', 
        name: 'creche_soleil', 
        label: 'Crèche Soleil TPS', 
        ageRange: '24-36 mois',
        ratioRequired: 8 // 1 éducateur pour 8 enfants
      },
      { 
        id: 'garderie', 
        name: 'garderie', 
        label: 'Garderie', 
        ageRange: '3-8 ans',
        ratioRequired: 10 // 1 éducateur pour 10 enfants
      },
      { 
        id: 'maternelle_PS1', 
        name: 'maternelle_PS1', 
        label: 'Maternelle Petite Section 1', 
        ageRange: '3-4ans',
        ratioRequired: 6 // 1 éducateur pour 6 tout-petits
      },
      { 
        id: 'maternelle_PS2', 
        name: 'maternelle_PS2', 
        label: 'Maternelle Petite Section 2', 
        ageRange: '4-5ans',
        ratioRequired: 8 // 1 éducateur pour 8 enfants
      },
      { 
        id: 'maternelle_MS', 
        name: 'maternelle_MS', 
        label: 'Maternelle Moyenne Section', 
        ageRange: '5-6ans',
        ratioRequired: 10 // 1 éducateur pour 10 enfants
      }
    ];

    return sectionConfigs.map(config => {
      const sectionGroups = groups
        .filter(group => group.section === config.name)
        .map(group => {
          const groupChildren = children.filter(child => child.group_id === group.id);
          return {
            ...group,
            children: groupChildren,
            children_count: groupChildren.length
          };
        });

      const totalChildren = sectionGroups.reduce((sum, group) => sum + group.children_count, 0);
      const totalCapacity = sectionGroups.reduce((sum, group) => sum + group.capacity, 0);

      return {
        ...config,
        groups: sectionGroups,
        totalChildren,
        totalCapacity
      };
    });
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    return (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  };

  const getAgeCompatibility = (child: Child, group: Group) => {
    const childAgeMonths = calculateAge(child.birth_date);
    
    if (group.age_min_months && childAgeMonths < group.age_min_months) {
      return 'too_young';
    }
    if (group.age_max_months && childAgeMonths > group.age_max_months) {
      return 'too_old';
    }
    return 'compatible';
  };

  const assignChildToGroup = async (childId: string, groupId: string) => {
    try {
      const { error } = await supabase
        .from('children')
        .update({ group_id: groupId })
        .eq('id', childId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Enfant assigné au groupe avec succès",
      });

      fetchData();
      setSelectedChild(null);
      setTargetGroup('');
    } catch (error) {
      console.error('Error assigning child:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner l'enfant au groupe",
        variant: "destructive",
      });
    }
  };

  const getComplianceStatus = (section: Section) => {
    const educatorCount = section.groups.filter(g => g.assigned_educator).length;
    const requiredEducators = Math.ceil(section.totalChildren / section.ratioRequired);
    
    if (educatorCount >= requiredEducators) {
      return { status: 'compliant', label: 'Conforme', color: 'default' };
    } else if (educatorCount === 0) {
      return { status: 'critical', label: 'Critique', color: 'destructive' };
    } else {
      return { status: 'warning', label: 'Attention', color: 'secondary' };
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion Avancée des Groupes</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calculator className="w-4 h-4 mr-2" />
            Calcul des Ratios
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sections" className="w-full">
        <TabsList>
          <TabsTrigger value="sections">Vue par Sections</TabsTrigger>
          <TabsTrigger value="assignments">
            Affectations
            {unassignedChildren.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unassignedChildren.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
        </TabsList>

        <TabsContent value="sections">
          <SectionsView sections={sections} />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentsView 
            unassignedChildren={unassignedChildren}
            sections={sections}
            onAssign={assignChildToGroup}
          />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceView sections={sections} getComplianceStatus={getComplianceStatus} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SectionsView({ sections }: { sections: Section[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
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
                  {section.totalChildren}/{section.totalCapacity} enfants
                </Badge>
                <Progress 
                  value={(section.totalChildren / section.totalCapacity) * 100} 
                  className="w-24"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AssignmentsView({ 
  unassignedChildren, 
  sections, 
  onAssign 
}: { 
  unassignedChildren: Child[];
  sections: Section[];
  onAssign: (childId: string, groupId: string) => void;
}) {
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Enfants non assignés ({unassignedChildren.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unassignedChildren.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {unassignedChildren.map((child) => (
                <Card key={child.id} className="border-2 border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{child.first_name} {child.last_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(calculateAge(child.birth_date) / 12)} ans {calculateAge(child.birth_date) % 12} mois
                        </p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedChild(child)}>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Assigner {child.first_name} {child.last_name}
                            </DialogTitle>
                          </DialogHeader>
                          <AssignmentDialog 
                            child={child}
                            sections={sections}
                            onAssign={onAssign}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <p className="text-lg font-medium">Tous les enfants sont assignés !</p>
              <p className="text-muted-foreground">Aucun enfant en attente d'affectation</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AssignmentDialog({ 
  child, 
  sections, 
  onAssign 
}: { 
  child: Child;
  sections: Section[];
  onAssign: (childId: string, groupId: string) => void;
}) {
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    return (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  };

  const childAgeMonths = calculateAge(child.birth_date);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <p><strong>Enfant:</strong> {child.first_name} {child.last_name}</p>
        <p><strong>Âge:</strong> {Math.floor(childAgeMonths / 12)} ans {childAgeMonths % 12} mois</p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id}>
            <h4 className="font-medium mb-2">{section.label}</h4>
            <div className="space-y-2">
              {section.groups.map((group) => {
                const hasSpace = group.children_count < group.capacity;
                const ageCompatible = !group.age_min_months || 
                  (childAgeMonths >= group.age_min_months && 
                   (!group.age_max_months || childAgeMonths <= group.age_max_months));

                return (
                  <div 
                    key={group.id} 
                    className={`p-3 border rounded-lg ${!hasSpace || !ageCompatible ? 'opacity-50' : 'cursor-pointer hover:bg-muted'}`}
                    onClick={() => hasSpace && ageCompatible && onAssign(child.id, group.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.children_count}/{group.capacity} enfants
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!hasSpace && (
                          <Badge variant="destructive">Complet</Badge>
                        )}
                        {!ageCompatible && (
                          <Badge variant="secondary">Âge non compatible</Badge>
                        )}
                        {hasSpace && ageCompatible && (
                          <Badge variant="default">Compatible</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComplianceView({ 
  sections, 
  getComplianceStatus 
}: { 
  sections: Section[];
  getComplianceStatus: (section: Section) => any;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conformité Réglementaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sections.map((section) => {
              const compliance = getComplianceStatus(section);
              const educatorCount = section.groups.filter(g => g.assigned_educator).length;
              const requiredEducators = Math.ceil(section.totalChildren / section.ratioRequired);

              return (
                <div key={section.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{section.label}</h4>
                    <Badge variant={compliance.color}>
                      {compliance.label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Enfants</p>
                      <p className="font-medium">{section.totalChildren}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Éducateurs présents</p>
                      <p className="font-medium">{educatorCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Éducateurs requis</p>
                      <p className="font-medium">{requiredEducators}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground">
                      Ratio réglementaire: 1 éducateur pour {section.ratioRequired} enfants
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  return (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
}