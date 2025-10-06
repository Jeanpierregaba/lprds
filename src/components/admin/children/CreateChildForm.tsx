import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, User, Heart, Users, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmergencyContact {
  id?: string;
  first_name: string;
  last_name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_emergency_contact: boolean;
  is_pickup_authorized: boolean;
  notes?: string;
}

interface DietaryRestriction {
  type: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
}

interface MedicalInfo {
  allergies: string[];
  medications: string[];
  chronic_conditions: string[];
  doctor_name?: string;
  doctor_phone?: string;
  medical_notes?: string;
}

export default function CreateChildForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('child');
  const [loading, setLoading] = useState(false);

  // Informations personnelles
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    admission_date: '',
    address: '',
    section: '' as 'creche' | 'garderie' | 'maternelle_etoile' | 'maternelle_soleil' | '',
    behavioral_notes: '',
    preferences: '',
  });

  // Informations médicales
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>({
    allergies: [],
    medications: [],
    chronic_conditions: [],
    doctor_name: '',
    doctor_phone: '',
    medical_notes: '',
  });

  // Restrictions alimentaires
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestriction[]>([]);

  // Parents / Tuteurs
  const [guardians, setGuardians] = useState<EmergencyContact[]>([
    {
      first_name: '',
      last_name: '',
      relationship: 'parent',
      phone: '',
      email: '',
      is_emergency_contact: true,
      is_pickup_authorized: true,
      notes: ''
    }
  ]);

  const addGuardian = () => {
    setGuardians([...guardians, {
      first_name: '',
      last_name: '',
      relationship: 'parent',
      phone: '',
      email: '',
      is_emergency_contact: true,
      is_pickup_authorized: true,
      notes: ''
    }]);
  };

  const removeGuardian = (index: number) => {
    setGuardians(guardians.filter((_, i) => i !== index));
  };

  const updateGuardian = (index: number, field: keyof EmergencyContact, value: any) => {
    const updated = [...guardians];
    updated[index] = { ...updated[index], [field]: value };
    setGuardians(updated);
  };

  // Personnes autorisées
  const [authorizedPersons, setAuthorizedPersons] = useState<EmergencyContact[]>([]);

  const addAuthorizedPerson = () => {
    setAuthorizedPersons([
      ...authorizedPersons,
      {
        first_name: '',
        last_name: '',
        relationship: 'other',
        phone: '',
        email: '',
        is_emergency_contact: false,
        is_pickup_authorized: true,
        notes: ''
      }
    ]);
  };

  const removeAuthorizedPerson = (index: number) => {
    setAuthorizedPersons(authorizedPersons.filter((_, i) => i !== index));
  };

  const updateAuthorizedPerson = (index: number, field: keyof EmergencyContact, value: any) => {
    const updated = [...authorizedPersons];
    updated[index] = { ...updated[index], [field]: value };
    setAuthorizedPersons(updated);
  };

  // Génération d'un code unique (A-Z0-9, 5 caractères)
  const generateRandomToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = '';
    for (let i = 0; i < 5; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  };

  const generateUniqueCodeQrId = async (): Promise<string> => {
    // Essayer jusqu'à trouver un token libre
    for (let attempts = 0; attempts < 10; attempts++) {
      const token = generateRandomToken();
      const { data, error } = await supabase
        .from('children')
        .select('id')
        .eq('code_qr_id', token)
        .limit(1);
      if (!error && (!data || data.length === 0)) {
        return token;
      }
    }
    // Fallback improbable
    return generateRandomToken();
  };

  const addAllergyOrMedication = (type: 'allergies' | 'medications' | 'chronic_conditions', value: string) => {
    if (value.trim()) {
      setMedicalInfo({
        ...medicalInfo,
        [type]: [...medicalInfo[type], value.trim()]
      });
    }
  };

  const removeAllergyOrMedication = (type: 'allergies' | 'medications' | 'chronic_conditions', index: number) => {
    setMedicalInfo({
      ...medicalInfo,
      [type]: medicalInfo[type].filter((_, i) => i !== index)
    });
  };

  const addDietaryRestriction = () => {
    setDietaryRestrictions([...dietaryRestrictions, {
      type: '',
      description: '',
      severity: 'mild'
    }]);
  };

  const updateDietaryRestriction = (index: number, field: keyof DietaryRestriction, value: any) => {
    const updated = [...dietaryRestrictions];
    updated[index] = { ...updated[index], [field]: value };
    setDietaryRestrictions(updated);
  };

  const removeDietaryRestriction = (index: number) => {
    setDietaryRestrictions(dietaryRestrictions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!personalInfo.first_name || !personalInfo.last_name || !personalInfo.birth_date || !personalInfo.admission_date) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Validation minimale des parents/tuteurs: au moins un avec nom et téléphone
    const guardianValid = guardians.some(g => g.first_name && g.last_name && g.phone);
    if (!guardianValid) {
      setActiveTab('guardians');
      toast({
        title: "Parents/Tuteurs requis",
        description: "Ajoutez au moins un parent/tuteur avec nom et téléphone.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Créer le code QR unique
      const code_qr_id = await generateUniqueCodeQrId();

      // Create child record
      const childData = {
        first_name: personalInfo.first_name,
        last_name: personalInfo.last_name,
        birth_date: personalInfo.birth_date,
        admission_date: personalInfo.admission_date,
        address: personalInfo.address || null,
        section: personalInfo.section || null,
        behavioral_notes: personalInfo.behavioral_notes || null,
        preferences: personalInfo.preferences || null,
        medical_info_detailed: medicalInfo as any,
        dietary_restrictions: dietaryRestrictions as any,
        emergency_contacts_detailed: [
          ...guardians,
          ...authorizedPersons
        ].filter(contact => contact.first_name && contact.last_name && contact.phone) as any,
        // Combine allergies for backward compatibility
        allergies: medicalInfo.allergies.join(', '),
        medical_info: medicalInfo.medical_notes || null,
        code_qr_id
      };

      const { data: childRecord, error: childError } = await supabase
        .from('children')
        .insert(childData)
        .select()
        .single();

      if (childError) throw childError;

      // Create emergency contacts (guardians + authorized persons)
      const validContacts = [...guardians, ...authorizedPersons].filter(contact => 
        contact.first_name && contact.last_name && contact.phone
      );

      if (validContacts.length > 0) {
        const contactsData = validContacts.map(contact => ({
          child_id: childRecord.id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          relationship: contact.relationship,
          phone: contact.phone,
          email: contact.email || null,
          is_emergency_contact: contact.is_emergency_contact,
          is_pickup_authorized: contact.is_pickup_authorized,
          notes: contact.notes || null,
        }));

        const { error: contactsError } = await supabase
          .from('authorized_persons')
          .insert(contactsData);

        if (contactsError) {
          console.error('Error creating contacts:', contactsError);
          // Don't fail the whole operation if contacts fail
        }
      }

      toast({
        title: "Succès",
        description: "Profil enfant créé avec succès",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating child:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le profil enfant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="child" className="flex items-center gap-1">
            <User className="w-4 h-4" />
            Enfant
          </TabsTrigger>
          <TabsTrigger value="guardians" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Parents/Tuteurs
          </TabsTrigger>
          <TabsTrigger value="authorized" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Personnes autorisées
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            Résumé
          </TabsTrigger>
        </TabsList>

        <TabsContent value="child" className="space-y-6">
          <PersonalInfoTab 
            personalInfo={personalInfo}
            setPersonalInfo={setPersonalInfo}
          />
          <MedicalInfoTab
            medicalInfo={medicalInfo}
            setMedicalInfo={setMedicalInfo}
            dietaryRestrictions={dietaryRestrictions}
            addAllergyOrMedication={addAllergyOrMedication}
            removeAllergyOrMedication={removeAllergyOrMedication}
            addDietaryRestriction={addDietaryRestriction}
            updateDietaryRestriction={updateDietaryRestriction}
            removeDietaryRestriction={removeDietaryRestriction}
          />
        </TabsContent>

        <TabsContent value="guardians" className="space-y-6">
          <EmergencyContactsTab
            emergencyContacts={guardians}
            addEmergencyContact={addGuardian}
            removeEmergencyContact={removeGuardian}
            updateEmergencyContact={updateGuardian}
          />
        </TabsContent>

        <TabsContent value="authorized" className="space-y-6">
          <EmergencyContactsTab
            emergencyContacts={authorizedPersons}
            addEmergencyContact={addAuthorizedPerson}
            removeEmergencyContact={removeAuthorizedPerson}
            updateEmergencyContact={updateAuthorizedPerson}
          />
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <SummaryTab
            personalInfo={personalInfo}
            medicalInfo={medicalInfo}
            dietaryRestrictions={dietaryRestrictions}
            guardians={guardians}
            authorizedPersons={authorizedPersons}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-6 border-t">
        <div className="flex gap-2">
          {activeTab !== 'child' && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                const tabs = ['child', 'guardians', 'authorized', 'summary'];
                const currentIndex = tabs.indexOf(activeTab);
                if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
              }}
            >
              Précédent
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {activeTab !== 'summary' ? (
            <Button 
              type="button"
              onClick={() => {
                const tabs = ['child', 'guardians', 'authorized', 'summary'];
                const currentIndex = tabs.indexOf(activeTab);
                if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
              }}
            >
              Suivant
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le Profil'}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

// Onglet Informations Personnelles
function PersonalInfoTab({ personalInfo, setPersonalInfo }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations de Base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                value={personalInfo.first_name}
                onChange={(e) => setPersonalInfo({ ...personalInfo, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                value={personalInfo.last_name}
                onChange={(e) => setPersonalInfo({ ...personalInfo, last_name: e.target.value })}
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
                value={personalInfo.birth_date}
                onChange={(e) => setPersonalInfo({ ...personalInfo, birth_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="admission_date">Date d'admission *</Label>
              <Input
                id="admission_date"
                type="date"
                value={personalInfo.admission_date}
                onChange={(e) => setPersonalInfo({ ...personalInfo, admission_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="section">Section</Label>
            <Select
              value={personalInfo.section}
              onValueChange={(value) => setPersonalInfo({ ...personalInfo, section: value as any })}
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
              value={personalInfo.address}
              onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
              placeholder="Adresse complète de l'enfant"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations Comportementales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="behavioral_notes">Notes comportementales</Label>
            <Textarea
              id="behavioral_notes"
              value={personalInfo.behavioral_notes}
              onChange={(e) => setPersonalInfo({ ...personalInfo, behavioral_notes: e.target.value })}
              placeholder="Tempérament, habitudes, réactions particulières..."
            />
          </div>

          <div>
            <Label htmlFor="preferences">Préférences</Label>
            <Textarea
              id="preferences"
              value={personalInfo.preferences}
              onChange={(e) => setPersonalInfo({ ...personalInfo, preferences: e.target.value })}
              placeholder="Jouets préférés, activités, goûts alimentaires..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Onglet Informations Médicales
function MedicalInfoTab({ 
  medicalInfo, 
  setMedicalInfo, 
  dietaryRestrictions,
  addAllergyOrMedication,
  removeAllergyOrMedication,
  addDietaryRestriction,
  updateDietaryRestriction,
  removeDietaryRestriction
}: any) {
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newCondition, setNewCondition] = useState('');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">🚨 Informations Critiques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Allergies</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Ajouter une allergie"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAllergyOrMedication('allergies', newAllergy);
                    setNewAllergy('');
                  }
                }}
              />
              <Button 
                type="button"
                size="sm"
                onClick={() => {
                  addAllergyOrMedication('allergies', newAllergy);
                  setNewAllergy('');
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {medicalInfo.allergies.map((allergy: string, index: number) => (
                <Badge key={index} variant="destructive" className="flex items-center gap-1">
                  {allergy}
                  <button
                    type="button"
                    onClick={() => removeAllergyOrMedication('allergies', index)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Médicaments</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Ajouter un médicament"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAllergyOrMedication('medications', newMedication);
                    setNewMedication('');
                  }
                }}
              />
              <Button 
                type="button"
                size="sm"
                onClick={() => {
                  addAllergyOrMedication('medications', newMedication);
                  setNewMedication('');
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {medicalInfo.medications.map((medication: string, index: number) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {medication}
                  <button
                    type="button"
                    onClick={() => removeAllergyOrMedication('medications', index)}
                    className="ml-1 hover:bg-secondary/20 rounded-full p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations Médicales Générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="doctor_name">Médecin traitant</Label>
              <Input
                id="doctor_name"
                value={medicalInfo.doctor_name}
                onChange={(e) => setMedicalInfo({ ...medicalInfo, doctor_name: e.target.value })}
                placeholder="Dr. Nom du médecin"
              />
            </div>
            <div>
              <Label htmlFor="doctor_phone">Téléphone médecin</Label>
              <Input
                id="doctor_phone"
                value={medicalInfo.doctor_phone}
                onChange={(e) => setMedicalInfo({ ...medicalInfo, doctor_phone: e.target.value })}
                placeholder="Numéro de téléphone"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="medical_notes">Notes médicales</Label>
            <Textarea
              id="medical_notes"
              value={medicalInfo.medical_notes}
              onChange={(e) => setMedicalInfo({ ...medicalInfo, medical_notes: e.target.value })}
              placeholder="Autres informations médicales importantes..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Restrictions Alimentaires
            <Button type="button" size="sm" onClick={addDietaryRestriction}>
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dietaryRestrictions.length > 0 ? (
            <div className="space-y-3">
              {dietaryRestrictions.map((restriction: DietaryRestriction, index: number) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <Input
                        value={restriction.type}
                        onChange={(e) => updateDietaryRestriction(index, 'type', e.target.value)}
                        placeholder="Type de restriction"
                      />
                      <Select
                        value={restriction.severity}
                        onValueChange={(value) => updateDietaryRestriction(index, 'severity', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mild">Légère</SelectItem>
                          <SelectItem value="moderate">Modérée</SelectItem>
                          <SelectItem value="severe">Sévère</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeDietaryRestriction(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={restriction.description}
                    onChange={(e) => updateDietaryRestriction(index, 'description', e.target.value)}
                    placeholder="Description détaillée de la restriction"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Aucune restriction alimentaire
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Onglet Contacts d'Urgence
function EmergencyContactsTab({ 
  emergencyContacts, 
  addEmergencyContact, 
  removeEmergencyContact, 
  updateEmergencyContact 
}: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Contacts d'Urgence & Personnes Autorisées</h3>
        <Button type="button" onClick={addEmergencyContact}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter Contact
        </Button>
      </div>

      <div className="space-y-4">
        {emergencyContacts.map((contact: EmergencyContact, index: number) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Contact #{index + 1}
                {emergencyContacts.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeEmergencyContact(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prénom *</Label>
                  <Input
                    value={contact.first_name}
                    onChange={(e) => updateEmergencyContact(index, 'first_name', e.target.value)}
                    placeholder="Prénom"
                    required
                  />
                </div>
                <div>
                  <Label>Nom *</Label>
                  <Input
                    value={contact.last_name}
                    onChange={(e) => updateEmergencyContact(index, 'last_name', e.target.value)}
                    placeholder="Nom"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Relation</Label>
                  <Select
                    value={contact.relationship}
                    onValueChange={(value) => updateEmergencyContact(index, 'relationship', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="grand_parent">Grand-parent</SelectItem>
                      <SelectItem value="uncle_aunt">Oncle/Tante</SelectItem>
                      <SelectItem value="sibling">Frère/Sœur</SelectItem>
                      <SelectItem value="guardian">Tuteur</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Téléphone *</Label>
                  <Input
                    value={contact.phone}
                    onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                    placeholder="Numéro de téléphone"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={contact.email}
                  onChange={(e) => updateEmergencyContact(index, 'email', e.target.value)}
                  placeholder="Adresse email"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`emergency-${index}`}
                    checked={contact.is_emergency_contact}
                    onCheckedChange={(checked) => updateEmergencyContact(index, 'is_emergency_contact', checked)}
                  />
                  <Label htmlFor={`emergency-${index}`}>Contact d'urgence</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`pickup-${index}`}
                    checked={contact.is_pickup_authorized}
                    onCheckedChange={(checked) => updateEmergencyContact(index, 'is_pickup_authorized', checked)}
                  />
                  <Label htmlFor={`pickup-${index}`}>Autorisé à récupérer</Label>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={contact.notes}
                  onChange={(e) => updateEmergencyContact(index, 'notes', e.target.value)}
                  placeholder="Notes particulières sur ce contact"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Onglet Résumé
function SummaryTab({ personalInfo, medicalInfo, dietaryRestrictions, guardians, authorizedPersons }: any) {
  const validGuardians = guardians.filter((c: EmergencyContact) => c.first_name && c.last_name && c.phone);
  const validAuthorized = authorizedPersons.filter((c: EmergencyContact) => c.first_name && c.last_name && c.phone);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Résumé du Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Informations Personnelles</h4>
            <p><strong>Nom complet:</strong> {personalInfo.first_name} {personalInfo.last_name}</p>
            <p><strong>Date de naissance:</strong> {personalInfo.birth_date}</p>
            <p><strong>Date d'admission:</strong> {personalInfo.admission_date}</p>
            {personalInfo.section && <p><strong>Section:</strong> {personalInfo.section}</p>}
          </div>

          {(medicalInfo.allergies.length > 0 || medicalInfo.medications.length > 0) && (
            <div>
              <h4 className="font-semibold mb-2 text-destructive">Informations Médicales Critiques</h4>
              {medicalInfo.allergies.length > 0 && (
                <p><strong>Allergies:</strong> {medicalInfo.allergies.join(', ')}</p>
              )}
              {medicalInfo.medications.length > 0 && (
                <p><strong>Médicaments:</strong> {medicalInfo.medications.join(', ')}</p>
              )}
            </div>
          )}

          {dietaryRestrictions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Restrictions Alimentaires</h4>
              {dietaryRestrictions.map((restriction: DietaryRestriction, index: number) => (
                <p key={index}>
                  <strong>{restriction.type}:</strong> {restriction.description} 
                  <Badge variant="outline" className="ml-2">{restriction.severity}</Badge>
                </p>
              ))}
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-2">Parents/Tuteurs ({validGuardians.length})</h4>
            {validGuardians.map((contact: EmergencyContact, index: number) => (
              <div key={`g-${index}`} className="mb-2">
                <p>
                  <strong>{contact.first_name} {contact.last_name}</strong> ({contact.relationship}) - {contact.phone}
                </p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-semibold mb-2">Personnes Autorisées ({validAuthorized.length})</h4>
            {validAuthorized.map((contact: EmergencyContact, index: number) => (
              <div key={`a-${index}`} className="mb-2">
                <p>
                  <strong>{contact.first_name} {contact.last_name}</strong> ({contact.relationship}) - {contact.phone}
                </p>
                <div className="flex gap-2 text-xs">
                  {contact.is_pickup_authorized && <Badge variant="secondary">Récupération</Badge>}
                  {contact.is_emergency_contact && <Badge variant="destructive">Urgence</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}