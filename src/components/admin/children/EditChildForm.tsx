import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  admission_date: string;
  address?: string | null;
  section?: 'creche' | 'garderie' | 'maternelle_etoile' | 'maternelle_soleil' | null;
  behavioral_notes?: string | null;
  preferences?: string | null;
}

export default function EditChildForm({ child, onSuccess }: { child: Child; onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    first_name: child.first_name || '',
    last_name: child.last_name || '',
    birth_date: child.birth_date || '',
    admission_date: child.admission_date || '',
    address: child.address || '',
    section: (child.section || '') as 'creche' | 'garderie' | 'maternelle_etoile' | 'maternelle_soleil' | '',
    behavioral_notes: child.behavioral_notes || '',
    preferences: child.preferences || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.birth_date || !form.admission_date) {
      toast({ title: 'Erreur', description: 'Champs obligatoires manquants', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('children')
        .update({
          first_name: form.first_name,
          last_name: form.last_name,
          birth_date: form.birth_date,
          admission_date: form.admission_date,
          address: form.address || null,
          section: form.section || null,
          behavioral_notes: form.behavioral_notes || null,
          preferences: form.preferences || null,
        })
        .eq('id', child.id);

      if (error) throw error;

      toast({ title: 'Succès', description: 'Informations mises à jour' });
      onSuccess();
    } catch (err) {
      console.error('update child error', err);
      toast({ title: 'Erreur', description: "Échec de la mise à jour", variant: 'destructive' });
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
            <Select value={form.section} onValueChange={(value) => setForm({ ...form, section: value as any })}>
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
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
      </div>
    </form>
  );
}


