import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, UserCircle, Baby } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface ParentChildRelation {
  id: string;
  parent_id: string;
  child_id: string;
  relationship: string;
  is_primary_contact: boolean;
  parent: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    user_id: string;
  };
  child: {
    id: string;
    first_name: string;
    last_name: string;
    section?: string;
    photo_url?: string;
  };
}

interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
}

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  section?: string;
}

export default function ParentChildAssignment() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<ParentChildRelation[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form state
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [relationship, setRelationship] = useState('parent');
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search filters
  const [parentSearch, setParentSearch] = useState('');
  const [childSearch, setChildSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all parent-child assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('parent_children')
        .select('*')
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Load parent and child details for each assignment
      const enrichedAssignments = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          const { data: parentData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, phone, user_id')
            .eq('id', assignment.parent_id)
            .single();

          const { data: childData } = await supabase
            .from('children')
            .select('id, first_name, last_name, section, photo_url')
            .eq('id', assignment.child_id)
            .single();

          return {
            ...assignment,
            parent: parentData || { id: '', first_name: '', last_name: '', user_id: '' },
            child: childData || { id: '', first_name: '', last_name: '' }
          };
        })
      );

      setAssignments(enrichedAssignments);

      // Fetch all parents
      const { data: parentsData, error: parentsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone, role')
        .eq('role', 'parent')
        .order('last_name');

      if (parentsError) throw parentsError;
      setParents(parentsData || []);

      // Fetch all children
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('id, first_name, last_name, section')
        .eq('status', 'active')
        .order('last_name');

      if (childrenError) throw childrenError;
      setChildren(childrenData || []);

    } catch (error: any) {
      console.error('Error loading assignments:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = async () => {
    if (!selectedParentId || !selectedChildId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un parent et un enfant",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('parent_children')
        .select('id')
        .eq('parent_id', selectedParentId)
        .eq('child_id', selectedChildId)
        .single();

      if (existing) {
        toast({
          title: "Erreur",
          description: "Cette assignation existe déjà",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('parent_children')
        .insert({
          parent_id: selectedParentId,
          child_id: selectedChildId,
          relationship: relationship,
          is_primary_contact: isPrimaryContact
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Assignation créée avec succès",
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error adding assignment:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de créer l'assignation",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette assignation ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('parent_children')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Assignation supprimée avec succès",
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de supprimer l'assignation",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedParentId('');
    setSelectedChildId('');
    setRelationship('parent');
    setIsPrimaryContact(false);
  };

  const getSectionLabel = (section?: string) => {
    if (!section) return 'Non définie';
    const labels: Record<string, string> = {
      'creche_etoile': 'Crèche Étoile',
      'creche_nuage': 'Crèche Nuage',
      'creche_soleil': 'Crèche Soleil',
      'garderie': 'Garderie',
      'maternelle_PS1': 'Maternelle PS1',
      'maternelle_PS2': 'Maternelle PS2',
      'maternelle_MS': 'Maternelle MS'
    };
    return labels[section] || section;
  };

  // Filter assignments based on search
  const filteredAssignments = assignments.filter(assignment => {
    const parentName = `${assignment.parent?.first_name || ''} ${assignment.parent?.last_name || ''}`.toLowerCase();
    const childName = `${assignment.child?.first_name || ''} ${assignment.child?.last_name || ''}`.toLowerCase();
    const searchLower = parentSearch.toLowerCase();
    const childSearchLower = childSearch.toLowerCase();
    
    const matchesParent = parentSearch === '' || parentName.includes(searchLower);
    const matchesChild = childSearch === '' || childName.includes(childSearchLower);
    
    return matchesParent && matchesChild;
  });

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Assignation Parent-Enfant</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les relations entre les parents et leurs enfants
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Assignation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une Assignation Parent-Enfant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Parent</Label>
                <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.first_name} {parent.last_name}
                        {parent.phone && ` - ${parent.phone}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Enfant</Label>
                <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un enfant" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.first_name} {child.last_name}
                        {child.section && ` - ${getSectionLabel(child.section)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Relation</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="mother">Mère</SelectItem>
                    <SelectItem value="father">Père</SelectItem>
                    <SelectItem value="guardian">Tuteur légal</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="primary-contact"
                  checked={isPrimaryContact}
                  onChange={(e) => setIsPrimaryContact(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="primary-contact">Contact principal</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddAssignment}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Création...' : 'Créer'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label>Rechercher un parent</Label>
          <Input
            placeholder="Nom du parent..."
            value={parentSearch}
            onChange={(e) => setParentSearch(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label>Rechercher un enfant</Label>
          <Input
            placeholder="Nom de l'enfant..."
            value={childSearch}
            onChange={(e) => setChildSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Assignments list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssignments.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Aucune assignation trouvée
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCircle className="w-4 h-4" />
                    Parent - Enfant
                  </CardTitle>
                  {assignment.is_primary_contact && (
                    <Badge variant="default">Contact principal</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Parent</p>
                    <p className="text-sm font-semibold">
                      {assignment.parent?.first_name} {assignment.parent?.last_name}
                    </p>
                    {assignment.parent?.phone && (
                      <p className="text-xs text-muted-foreground">
                        {assignment.parent.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Enfant</p>
                    <p className="text-sm font-semibold flex items-center gap-1">
                      <Baby className="w-3 h-3" />
                      {assignment.child?.first_name} {assignment.child?.last_name}
                    </p>
                    {assignment.child?.section && (
                      <p className="text-xs text-muted-foreground">
                        {getSectionLabel(assignment.child.section)}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Relation</p>
                    <Badge variant="outline">{assignment.relationship}</Badge>
                  </div>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteAssignment(assignment.id)}
                    className="w-full mt-2"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
