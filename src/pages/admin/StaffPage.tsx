import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, Phone, MapPin, Edit, UserCircle, Briefcase, AlertTriangle, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  role: 'admin' | 'secretary' | 'educator' | 'parent';
  is_active: boolean;
  created_at: string;
}

interface Group {
  id: string;
  name: string;
  section: string;
  assigned_educator_id?: string;
}

interface StaffWithAssignments extends Profile {
  assigned_groups: Group[];
}

const staffFormSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['admin', 'secretary', 'educator'], {
    required_error: 'Veuillez sélectionner un rôle'
  })
});

const StaffPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffWithAssignments[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<StaffWithAssignments | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedGroupsForAssignment, setSelectedGroupsForAssignment] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      role: 'educator'
    }
  });

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all staff (educators, secretaries, admins)
      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'secretary', 'educator'])
        .order('last_name', { ascending: true });

      if (staffError) throw staffError;

      // Fetch all groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('name', { ascending: true });

      if (groupsError) throw groupsError;

      setGroups(groupsData || []);

      // Build staff with their assigned groups
      const staffWithGroups: StaffWithAssignments[] = (staffData || []).map(member => ({
        ...member,
        assigned_groups: (groupsData || []).filter(g => g.assigned_educator_id === member.id)
      }));

      setStaff(staffWithGroups);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du personnel',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSectionLabel = (section: string) => {
    const labels: { [key: string]: string } = {
      'creche_etoile': 'Crèche Étoile',
      'creche_nuage': 'Crèche Nuage',
      'creche_soleil': 'Crèche Soleil TPS',
      'garderie': 'Garderie',
      'maternelle_PS1': 'Maternelle Petite Section 1',
      'maternelle_PS2': 'Maternelle Petite Section 2',
      'maternelle_MS': 'Maternelle Moyenne Section'
    };
    return labels[section] || section;
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      'admin': 'Administrateur',
      'secretary': 'Secrétaire',
      'educator': 'Éducateur/Éducatrice',
      'parent': 'Parent'
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'secretary': return 'secondary';
      case 'educator': return 'default';
      default: return 'outline';
    }
  };

  const openAssignDialog = (member: StaffWithAssignments) => {
    setSelectedStaff(member);
    setSelectedGroupsForAssignment(member.assigned_groups.map(g => g.id));
    setIsAssignDialogOpen(true);
  };

  const handleSaveAssignments = async () => {
    if (!selectedStaff) return;

    try {
      // Get current assignments
      const currentGroupIds = selectedStaff.assigned_groups.map(g => g.id);
      
      // Groups to unassign (were assigned, no longer selected)
      const groupsToUnassign = currentGroupIds.filter(id => !selectedGroupsForAssignment.includes(id));
      
      // Groups to assign (newly selected)
      const groupsToAssign = selectedGroupsForAssignment.filter(id => !currentGroupIds.includes(id));

      // Unassign groups
      if (groupsToUnassign.length > 0) {
        const { error: unassignError } = await supabase
          .from('groups')
          .update({ assigned_educator_id: null })
          .in('id', groupsToUnassign);

        if (unassignError) throw unassignError;
      }

      // Assign groups
      if (groupsToAssign.length > 0) {
        const { error: assignError } = await supabase
          .from('groups')
          .update({ assigned_educator_id: selectedStaff.id })
          .in('id', groupsToAssign);

        if (assignError) throw assignError;
      }

      toast({
        title: 'Succès',
        description: 'Les affectations ont été mises à jour'
      });

      setIsAssignDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error updating assignments:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les affectations',
        variant: 'destructive'
      });
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupsForAssignment(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const onSubmitStaff = async (values: z.infer<typeof staffFormSchema>) => {
    try {
      setIsCreating(true);

      // Create user account with email confirmation
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: Math.random().toString(36).slice(-8) + 'Aa1!', // Temporary password
        options: {
          emailRedirectTo: `${window.location.origin}/admin/reset-password`,
          data: {
            first_name: values.first_name,
            last_name: values.last_name,
            role: values.role
          }
        }
      });

      if (signUpError) throw signUpError;

      // Update profile with additional information
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: values.phone,
            address: values.address
          })
          .eq('user_id', authData.user.id);

        if (profileError) throw profileError;
      }

      toast({
        title: 'Succès',
        description: `Un email de confirmation a été envoyé à ${values.email}. Le personnel pourra créer son mot de passe en suivant le lien.`
      });

      setIsCreateDialogOpen(false);
      form.reset();
      fetchData();
    } catch (error: any) {
      console.error('Error creating staff account:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le compte',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const educators = staff.filter(s => s.role === 'educator');
  const adminAndSecretaries = staff.filter(s => s.role === 'admin' || s.role === 'secretary');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion du Personnel</h1>
          <p className="text-muted-foreground mt-1">
            Liste et affectations de l'équipe éducative
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {staff.length} {staff.length > 1 ? 'membres' : 'membre'}
          </Badge>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un personnel
          </Button>
        </div>
      </div>

      {/* Équipe Éducative */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Équipe Éducative ({educators.length})
          </CardTitle>
          <CardDescription>
            Éducateurs et éducatrices avec leurs affectations aux sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {educators.length > 0 ? (
            <div className="space-y-4">
              {educators.map((member) => (
                <Card key={member.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <UserCircle className="w-8 h-8 text-primary" />
                          <div>
                            <h3 className="font-semibold text-lg">
                              {member.first_name} {member.last_name}
                            </h3>
                            <Badge variant={getRoleBadgeVariant(member.role)} className="mt-1">
                              {getRoleLabel(member.role)}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                          {member.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{member.address}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Sections assignées ({member.assigned_groups.length})
                          </Label>
                          {member.assigned_groups.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {member.assigned_groups.map((group) => (
                                <Badge key={group.id} variant="secondary">
                                  {getSectionLabel(group.section)} - {group.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-amber-600 mt-2">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Aucune section assignée</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openAssignDialog(member)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Gérer les affectations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Aucun éducateur enregistré
            </p>
          )}
        </CardContent>
      </Card>

      {/* Administration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Administration ({adminAndSecretaries.length})
          </CardTitle>
          <CardDescription>
            Administrateurs et secrétaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminAndSecretaries.length > 0 ? (
            <div className="space-y-3">
              {adminAndSecretaries.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserCircle className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {member.first_name} {member.last_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {getRoleLabel(member.role)}
                        </Badge>
                        {member.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Aucun administrateur enregistré
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour gérer les affectations */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gérer les affectations - {selectedStaff?.first_name} {selectedStaff?.last_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-3">Sélectionnez les groupes à assigner</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Cochez les groupes que cet éducateur doit superviser
              </p>

              {Object.entries(
                groups.reduce((acc, group) => {
                  if (!acc[group.section]) acc[group.section] = [];
                  acc[group.section].push(group);
                  return acc;
                }, {} as { [key: string]: Group[] })
              ).map(([section, sectionGroups]) => (
                <div key={section} className="mb-6">
                  <h4 className="font-semibold text-sm mb-3 text-primary">
                    {getSectionLabel(section)}
                  </h4>
                  <div className="space-y-2 pl-4">
                    {sectionGroups.map((group) => {
                      const isSelected = selectedGroupsForAssignment.includes(group.id);
                      const assignedToOther = group.assigned_educator_id && 
                        group.assigned_educator_id !== selectedStaff?.id;
                      
                      return (
                        <div
                          key={group.id}
                          className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-primary/10 border-primary' 
                              : assignedToOther 
                              ? 'bg-muted/50 border-muted'
                              : 'hover:bg-accent'
                          }`}
                          onClick={() => toggleGroupSelection(group.id)}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleGroupSelection(group.id)}
                              className="w-4 h-4"
                            />
                            <span className="font-medium">{group.name}</span>
                          </div>
                          {assignedToOther && (
                            <Badge variant="outline" className="text-xs">
                              Déjà assigné
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveAssignments}>
                Enregistrer les affectations
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour créer un nouveau personnel */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau personnel</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitStaff)} className="space-y-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrateur</SelectItem>
                        <SelectItem value="secretary">Secrétaire</SelectItem>
                        <SelectItem value="educator">Éducateur/Éducatrice</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    form.reset();
                  }}
                  disabled={isCreating}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Création...' : 'Créer et envoyer invitation'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPage;