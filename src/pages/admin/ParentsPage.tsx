import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Plus, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const parentFormSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  address: z.string().optional(),
  child_id: z.string().optional(),
  relationship: z.string().optional(),
  is_primary_contact: z.boolean().optional(),
});

const PAGE_SIZE = 10;

const ParentsPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [parents, setParents] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [totalParents, setTotalParents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<z.infer<typeof parentFormSchema>>({
    resolver: zodResolver(parentFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      child_id: '',
      relationship: 'parent',
      is_primary_contact: false,
    },
  });

  useEffect(() => {
    fetchParents();
    fetchChildren();
    // eslint-disable-next-line
  }, [search, filterActive, currentPage]);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('first_name');
      
      if (error) throw error;
      setChildren(data || []);
    } catch (error: any) {
      console.error('Error fetching children:', error);
    }
  };

  const fetchParents = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'parent');

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (filterActive !== 'all') {
      query = query.eq('is_active', filterActive === 'active');
    }
    query = query.order('last_name', { ascending: true })
      .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

    const { data, count, error } = await query;
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      setParents([]);
    } else {
      setParents(data || []);
      setTotalParents(count || 0);
    }
    setLoading(false);
  };

  const onSubmitParent = async (values: z.infer<typeof parentFormSchema>) => {
    try {
      setIsCreating(true);
      // Use the deployed URL for production, or current origin for development
      const siteUrl = window.location.hostname === 'localhost' 
        ? window.location.origin 
        : `https://${window.location.hostname}`;
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: Math.random().toString(36).slice(-8) + 'Aa1!',
        options: {
          emailRedirectTo: `${siteUrl}/reset-password`,
          data: {
            first_name: values.first_name,
            last_name: values.last_name,
            role: 'parent',
          },
        },
      });
      if (signUpError) throw signUpError;

      let parentProfileId: string | undefined;
      
      if (authData.user) {
        // Update profile with additional information
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: values.phone,
            address: values.address,
          })
          .eq('user_id', authData.user.id);
        if (profileError) throw profileError;

        // Get the profile ID
        const { data: profileData, error: profileIdError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', authData.user.id)
          .single();
        if (profileIdError) throw profileIdError;
        parentProfileId = profileData?.id;

        // If child is selected, create the relationship
        if (values.child_id && parentProfileId) {
          const { error: relationshipError } = await supabase
            .from('parent_children')
            .insert({
              parent_id: parentProfileId,
              child_id: values.child_id,
              relationship: values.relationship || 'parent',
              is_primary_contact: values.is_primary_contact || false,
            });
          if (relationshipError) throw relationshipError;
        }
      }

      toast({
        title: 'Succès',
        description: `Un email de confirmation a été envoyé à ${values.email}. Le parent pourra créer son mot de passe en suivant le lien.`,
      });
      setIsDialogOpen(false);
      form.reset();
      fetchParents();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le compte',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const totalPages = Math.ceil(totalParents / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Parents</h1>
          <p className="text-muted-foreground mt-1">Inviter et gérer les comptes parents</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-end">
          <Input placeholder="Recherche par nom, email..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="md:w-48" />
          <select value={filterActive} onChange={e => { setFilterActive(e.target.value); setCurrentPage(1); }} className="border rounded px-3 py-2 text-sm">
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un parent
          </Button>
        </div>
      </div>
      {/* Liste des parents */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des parents ({totalParents})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin mr-3" /> Loading...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="font-medium text-left">Nom</th>
                  <th className="font-medium text-left">Email</th>
                  <th className="font-medium text-left">Téléphone</th>
                  <th className="font-medium text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {parents.map((parent) => (
                  <tr key={parent.id} className="border-b last:border-0">
                    <td>{parent.last_name} {parent.first_name}</td>
                    <td>{parent.email}</td>
                    <td>{parent.phone || '-'}</td>
                    <td><Badge variant={parent.is_active ? 'default' : 'secondary'}>{parent.is_active ? 'Actif' : 'Inactif'}</Badge></td>
                  </tr>
                ))}
                {parents.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">Aucun parent trouvé</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Page {currentPage} / {totalPages || 1}</span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>Précédent</Button>
          <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Suivant</Button>
        </div>
      </div>
      {/* Dialog pour créer un nouveau parent */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau parent</DialogTitle>
              <CardDescription>Créez un compte parent et assignez-lui un enfant</CardDescription>
            </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmitParent)} className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Prénom *" {...form.register('first_name')} />
              <Input placeholder="Nom *" {...form.register('last_name')} />
            </div>
            <Input placeholder="Email *" type="email" {...form.register('email')} />
            <Input placeholder="Téléphone" {...form.register('phone')} />
            <Input placeholder="Adresse" {...form.register('address')} />
            
            <div className="space-y-3">
              <label className="text-sm font-medium">Assigner un enfant (optionnel)</label>
              <Select onValueChange={(value) => form.setValue('child_id', value === 'none' ? '' : value)} value={form.watch('child_id') || 'none'}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un enfant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {form.watch('child_id') && (
                <>
                  <Select onValueChange={(value) => form.setValue('relationship', value)} value={form.watch('relationship')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Relation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="mother">Mère</SelectItem>
                      <SelectItem value="father">Père</SelectItem>
                      <SelectItem value="guardian">Tuteur</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...form.register('is_primary_contact')}
                      className="w-4 h-4"
                    />
                    <label className="text-sm">Contact principal</label>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); form.reset(); }} disabled={isCreating}>
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Création...' : 'Créer et envoyer invitation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParentsPage;
