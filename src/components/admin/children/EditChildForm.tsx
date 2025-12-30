import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { reassignChildOnSectionChange } from '@/lib/groupAssignment';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  admission_date: string;
  address?: string | null;
  section?: 'creche_etoile' | 'creche_nuage' | 'creche_soleil' | 'garderie' | 'maternelle_PS1' | 'maternelle_PS2' | 'maternelle_MS' | 'maternelle_GS' | null;
  behavioral_notes?: string | null;
  preferences?: string | null;
  assigned_educator_id?: string | null;
}


export default function EditChildForm({ child, onSuccess }: { child: Child; onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    first_name: child.first_name || '',
    last_name: child.last_name || '',
    birth_date: child.birth_date || '',
    admission_date: child.admission_date || '',
    address: child.address || '',
    section: child.section,
    behavioral_notes: child.behavioral_notes || '',
    preferences: child.preferences || ''
  });
  const [loading, setLoading] = useState(false);
  const [educators, setEducators] = useState<any[]>([]);
  const [selectedEducators, setSelectedEducators] = useState<string[]>([]);

  useEffect(() => {
    const loadEducators = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('role', 'educator')
          .order('first_name');
        if (error) throw error;
        setEducators(data || []);
      } catch (error) {
        console.error('Erreur chargement éducateurs:', error);
      }
    };

    const loadLinks = async () => {
      // Use assigned_educator_id from children table directly
      if (child.assigned_educator_id) {
        setSelectedEducators([child.assigned_educator_id]);
      }
    };

    loadEducators();
    loadLinks();
  }, [child.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.birth_date || !form.admission_date) {
      toast({ title: 'Erreur', description: 'Champs obligatoires manquants', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      
      // Vérifier la session utilisateur
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        throw new Error('Utilisateur non authentifié');
      }
      console.log('Current user:', user.id);

      // Vérifier le profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Erreur de profil utilisateur');
      }
      console.log('User profile:', profile);

      // Test des permissions RLS
      const { data: permissionTest, error: permissionError } = await supabase
        .from('children')
        .select('id')
        .eq('id', child.id)
        .limit(1);
      
      if (permissionError) {
        console.error('Permission test failed:', permissionError);
        throw new Error(`Erreur de permissions: ${permissionError.message}`);
      }
      console.log('Permission test passed:', permissionTest);

      // Test de la fonction de sécurité
      const { data: securityTest, error: securityError } = await supabase
        .rpc('is_admin_or_secretary', { user_uuid: user.id });
      
      if (securityError) {
        console.error('Security function test failed:', securityError);
      } else {
        console.log('Security function result:', securityTest);
      }

      // Préparer les données de mise à jour
      const updateData: any = {
        first_name: form.first_name,
        last_name: form.last_name,
        birth_date: form.birth_date,
        admission_date: form.admission_date,
        address: form.address || null,
        behavioral_notes: form.behavioral_notes || null,
        preferences: form.preferences || null,
      };

      // Section field - no mapping needed as DB uses same values
      updateData.section = form.section;

      console.log('Child ID:', child.id);
      console.log('Updating child with data:', updateData);
      console.log('User role:', profile.role);

      // Test de lecture avant mise à jour
      const { data: existingChild, error: readError } = await supabase
        .from('children')
        .select('*')
        .eq('id', child.id)
        .single();
      
      if (readError) {
        console.error('Read error:', readError);
        throw new Error(`Impossible de lire les données de l'enfant: ${readError.message}`);
      }
      console.log('Existing child data:', existingChild);

      // Vérifier si la section a changé pour réassigner automatiquement
      const oldSection = child.section;
      const newSection = updateData.section;
      const sectionChanged = oldSection !== newSection;

      // Tentative de mise à jour avec gestion d'erreur détaillée
      const { data, error } = await supabase
        .from('children')
        .update(updateData)
        .eq('id', child.id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Messages d'erreur plus spécifiques
        let errorMessage = 'Erreur inconnue';
        if (error.code === '42501') {
          errorMessage = 'Permissions insuffisantes. Vérifiez que vous êtes admin ou secrétaire.';
        } else if (error.code === '23505') {
          errorMessage = 'Violation de contrainte unique. Une valeur existe déjà.';
        } else if (error.code === '23503') {
          errorMessage = 'Violation de contrainte de clé étrangère.';
        } else if (error.message.includes('section')) {
          errorMessage = 'Valeur de section invalide.';
        } else if (error.message.includes('date')) {
          errorMessage = 'Format de date invalide.';
        } else {
          errorMessage = error.message || 'Erreur de mise à jour';
        }
        
        throw new Error(errorMessage);
      }

      console.log('Update successful:', data);

      // Si la section a changé, réassigner automatiquement au groupe approprié
      if (sectionChanged && newSection) {
        await reassignChildOnSectionChange(
          child.id,
          newSection,
          form.birth_date
        );
      }

      // L'éducateur principal est géré via assigned_educator_id dans le formulaire
      // Pas besoin de table child_educators séparée

      toast({ 
        title: 'Succès', 
        description: sectionChanged 
          ? 'Informations mises à jour et enfant réassigné au groupe approprié' 
          : 'Informations mises à jour'
      });
      onSuccess();
    } catch (err) {
      console.error('update child error', err);
      toast({ 
        title: 'Erreur', 
        description: `Échec de la mise à jour: ${err instanceof Error ? err.message : 'Erreur inconnue'}`, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations de Base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prénom *</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date de naissance *</Label>
              <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            <div>
              <Label>Date d'admission *</Label>
              <Input type="date" value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Section</Label>
            <Select 
              value={form.section || 'none'} 
              onValueChange={(value) => setForm({ ...form, section: value === 'none' ? null : value as 'creche_etoile' | 'creche_nuage' | 'creche_soleil' | 'garderie' | 'maternelle_PS1' | 'maternelle_PS2' | 'maternelle_MS' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune section</SelectItem>
                <SelectItem value="creche_etoile">Crèche Étoile (3-18 mois)</SelectItem>
                <SelectItem value="creche_nuage">Crèche Nuage (18-24 mois)</SelectItem>
                <SelectItem value="creche_soleil">Crèche Soleil TPS (24-36 mois)</SelectItem>
                <SelectItem value="garderie">Garderie (3-8 ans)</SelectItem>
                <SelectItem value="maternelle_PS1">Maternelle Petite Section 1</SelectItem>
                <SelectItem value="maternelle_PS2">Maternelle Petite Section 2</SelectItem>
                <SelectItem value="maternelle_MS">Maternelle Moyenne Section</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Adresse</Label>
            <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>

          <div>
            <Label>Notes comportementales</Label>
            <Textarea value={form.behavioral_notes} onChange={(e) => setForm({ ...form, behavioral_notes: e.target.value })} />
          </div>

          <div>
            <Label>Préférences</Label>
            <Textarea value={form.preferences} onChange={(e) => setForm({ ...form, preferences: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Éducateurs assignés (multi)</Label>
            {educators.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun éducateur disponible.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {educators.map((edu) => {
                  const checked = selectedEducators.includes(edu.id);
                  return (
                    <label
                      key={edu.id}
                      className="flex items-center gap-2 p-2 border rounded-md cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const v = e.target.checked;
                          setSelectedEducators((prev) =>
                            v ? [...prev, edu.id] : prev.filter((id) => id !== edu.id)
                          );
                        }}
                      />
                      <span className="text-sm">
                        {edu.first_name} {edu.last_name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
      </div>
    </form>
  );
}


