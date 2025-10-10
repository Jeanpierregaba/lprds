import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Download, Upload, User, FileText, Activity, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Child {
  id: string;
  code_qr_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  admission_date?: string;
  status?: string;
  address?: string;
  photo_url?: string;
  allergies?: string;
  medical_info?: string;
  special_needs?: string;
  section?: 'creche_etoile' | 'creche_nuage' | 'creche_soleil' | 'garderie' | 'maternelle_PS1' | 'maternelle_PS2' | 'maternelle_MS';
  group_id?: string;
  medical_info_detailed?: any;
  emergency_contacts_detailed?: any;
  dietary_restrictions?: any;
  behavioral_notes?: string;
  preferences?: string;
  administrative_documents?: any;
  medical_history?: any;
}

interface EmergencyContact {
  id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_emergency_contact: boolean;
  is_pickup_authorized: boolean;
  photo_url?: string;
  notes?: string;
}

interface MedicalRecord {
  id: string;
  date: string;
  record_type: string;
  description: string;
  doctor_name?: string;
  doctor_contact?: string;
  notes?: string;
  documents?: any;
}

export default function ChildDetailView({ child }: { child: Child }) {
  const { toast } = useToast();
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildData();
  }, [child.id]);

  const fetchChildData = async () => {
    try {
      setLoading(true);
      
      // Fetch emergency contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('authorized_persons')
        .select('*')
        .eq('child_id', child.id);

      if (contactsError) throw contactsError;

      // Fetch medical records
      const { data: medicalData, error: medicalError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('child_id', child.id)
        .order('date', { ascending: false });

      if (medicalError) throw medicalError;

      setEmergencyContacts(contactsData || []);
      setMedicalRecords(medicalData || []);
    } catch (error) {
      console.error('Error fetching child data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données détaillées",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  // Helper accessible pour formater l'affichage de la section
  const getSectionLabel = (section?: string): string => {
    if (!section) return 'Non définie';
    const labels: Record<string, string> = {
      'creche_etoile': 'Crèche Étoile (3-18 mois)',
      'creche_nuage': 'Crèche Nuage (18-24 mois)',
      'creche_soleil': 'Crèche Soleil TPS (24-36 mois)',
      'garderie': 'Garderie (3-8 ans)',
      'maternelle_PS1': 'Maternelle Petite Section 1',
      'maternelle_PS2': 'Maternelle Petite Section 2',
      'maternelle_MS': 'Maternelle Moyenne Section'
    };
    return labels[section] || section;
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid grid-cols-5 w-full">
        <TabsTrigger value="general" className="flex items-center gap-1">
          <User className="w-4 h-4" />
          Général
        </TabsTrigger>
        <TabsTrigger value="medical" className="flex items-center gap-1">
          <Heart className="w-4 h-4" />
          Médical
        </TabsTrigger>
        <TabsTrigger value="contacts" className="flex items-center gap-1">
          <User className="w-4 h-4" />
          Contacts
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-1">
          <FileText className="w-4 h-4" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-1">
          <Activity className="w-4 h-4" />
          Historique
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <GeneralInfoTab child={child} calculateAge={calculateAge} />
      </TabsContent>

      <TabsContent value="medical" className="space-y-6">
        <MedicalInfoTab child={child} medicalRecords={medicalRecords} onRefresh={fetchChildData} />
      </TabsContent>

      <TabsContent value="contacts" className="space-y-6">
        <EmergencyContactsTab 
          childId={child.id} 
          contacts={emergencyContacts} 
          onRefresh={fetchChildData} 
        />
      </TabsContent>

      <TabsContent value="documents" className="space-y-6">
        <DocumentsTab child={child} />
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        <HistoryTab childId={child.id} />
      </TabsContent>
    </Tabs>
  );
}

// Onglet Informations Générales
function GeneralInfoTab({ child, calculateAge }: { child: Child; calculateAge: (date: string) => string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations Personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Code QR</Label>
            <p className="font-mono text-lg text-primary">
              {(() => {
                const raw = (child.code_qr_id || '').toString();
                const stripped = raw.replace(/^LPRDS-/, '');
                const token = stripped.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
                return `LPRDS-${token}`;
              })()}
            </p>
          </div>
          <div>
            <Label>Statut</Label>
            <div className="mt-1">
              <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                {child.status === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
          <div>
            <Label>Date de naissance</Label>
            <p>{new Date(child.birth_date).toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <Label>Âge actuel</Label>
            <p className="font-semibold text-accent">{calculateAge(child.birth_date)}</p>
          </div>
          <div>
            <Label>Date d'admission</Label>
            <p>{new Date(child.admission_date || '').toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <Label>Section</Label>
            <p>{(() => {
              const labels: Record<string, string> = {
                'creche_etoile': 'Crèche Étoile (3-18 mois)',
                'creche_nuage': 'Crèche Nuage (18-24 mois)',
                'creche_soleil': 'Crèche Soleil TPS (24-36 mois)',
                'garderie': 'Garderie (3-8 ans)',
                'maternelle_PS1': 'Maternelle Petite Section 1',
                'maternelle_PS2': 'Maternelle Petite Section 2',
                'maternelle_MS': 'Maternelle Moyenne Section'
              };
              return child.section ? (labels[child.section] || child.section) : 'Non définie';
            })()}</p>
          </div>
        </CardContent>
      </Card>

      {child.address && (
        <Card>
          <CardHeader>
            <CardTitle>Adresse</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{child.address}</p>
          </CardContent>
        </Card>
      )}

      {(child.behavioral_notes || child.preferences) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes Comportementales & Préférences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {child.behavioral_notes && (
              <div>
                <Label>Notes comportementales</Label>
                <p className="text-muted-foreground">{child.behavioral_notes}</p>
              </div>
            )}
            {child.preferences && (
              <div>
                <Label>Préférences</Label>
                <p className="text-muted-foreground">{child.preferences}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Onglet Informations Médicales
function MedicalInfoTab({ child, medicalRecords, onRefresh }: { 
  child: Child; 
  medicalRecords: MedicalRecord[];
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Informations Critiques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {child.allergies && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <Label className="text-destructive font-semibold">🚨 Allergies</Label>
              <p className="text-destructive font-medium">{child.allergies}</p>
            </div>
          )}
          
          {child.special_needs && (
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <Label className="text-accent font-semibold">⚠️ Besoins Spéciaux</Label>
              <p className="text-accent">{child.special_needs}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {child.medical_info && (
        <Card>
          <CardHeader>
            <CardTitle>Informations Médicales Générales</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{child.medical_info}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Historique Médical
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medicalRecords.length > 0 ? (
            <div className="space-y-3">
              {medicalRecords.map((record) => (
                <div key={record.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{record.record_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm">{record.description}</p>
                      {record.doctor_name && (
                        <p className="text-xs text-muted-foreground">
                          Dr. {record.doctor_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Aucun historique médical enregistré
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Onglet Contacts d'Urgence
function EmergencyContactsTab({ childId, contacts, onRefresh }: { 
  childId: string; 
  contacts: EmergencyContact[];
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Contacts d'Urgence & Personnes Autorisées</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Ajouter Contact
        </Button>
      </div>

      {contacts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {contact.first_name} {contact.last_name}
                  <div className="flex gap-1">
                    {contact.is_emergency_contact && (
                      <Badge variant="destructive" className="text-xs">Urgence</Badge>
                    )}
                    {contact.is_pickup_authorized && (
                      <Badge variant="secondary" className="text-xs">Récupération</Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm"><strong>Relation:</strong> {contact.relationship}</p>
                <p className="text-sm"><strong>Téléphone:</strong> {contact.phone}</p>
                {contact.email && (
                  <p className="text-sm"><strong>Email:</strong> {contact.email}</p>
                )}
                {contact.notes && (
                  <p className="text-sm text-muted-foreground">{contact.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun contact d'urgence enregistré</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Onglet Documents
function DocumentsTab({ child }: { child: Child }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documents Administratifs</h3>
        <Button size="sm">
          <Upload className="w-4 h-4 mr-1" />
          Télécharger Document
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">📋 Certificats Médicaux</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Documents médicaux avec dates d'expiration
            </p>
            <Button size="sm" variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter Certificat
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-primary">🆔 Documents d'Identité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Pièces d'identité et justificatifs
            </p>
            <Button size="sm" variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter Document
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-accent">📖 Carnet de Santé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Pages scannées du carnet
            </p>
            <Button size="sm" variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Scanner Page
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents Récents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Aucun document téléchargé pour le moment
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Onglet Historique
function HistoryTab({ childId }: { childId: string }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Historique & Incidents</h3>
      
      <Card>
        <CardHeader>
          <CardTitle>Activités Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Aucune activité récente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incidents & Remarques</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Aucun incident signalé
          </p>
        </CardContent>
      </Card>
    </div>
  );
}