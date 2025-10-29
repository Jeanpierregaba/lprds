import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, 
  Heart, 
  Utensils, 
  Bed, 
  Droplets,
  Camera,
  Save,
  Send,
  User,
  CalendarDays,
  Smile,
  Meh,
  Frown,
  Baby,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  section?: string;
}

interface DailyReportData {
  child_id: string;
  report_date: string;
  arrival_time?: string;
  departure_time?: string;
  health_status: 'bien' | 'surveiller' | 'malade';
  health_notes?: string;
  activities: string[];
  nap_taken: boolean;
  nap_duration_minutes?: number;
  breakfast_eaten: 'bien_mange' | 'peu_mange' | 'rien_mange';
  lunch_eaten: 'bien_mange' | 'peu_mange' | 'rien_mange';
  snack_eaten: 'bien_mange' | 'peu_mange' | 'rien_mange';
  hygiene_bath: boolean;
  hygiene_bowel_movement: boolean;
  hygiene_frequency_notes?: string;
  mood: 'joyeux' | 'calme' | 'agite' | 'triste' | 'fatigue';
  special_observations?: string;
  photos: File[];
}

interface DailyReportFormProps {
  childId?: string;
  reportDate?: string;
  existingReport?: any;
  onSaved?: () => void;
}

const ACTIVITY_OPTIONS = [
  'Peinture', 'Dessin', 'Lecture', 'Jeux d\'extérieur', 'Jeux de construction',
  'Musique', 'Chant', 'Danse', 'Jardinage', 'Cuisine', 'Motricité',
  'Jeux d\'eau', 'Puzzle', 'Jeux de société', 'Activité sensorielle'
];

const MOOD_OPTIONS = [
  { value: 'joyeux', label: 'Joyeux', icon: '😊', color: 'text-green-500' },
  { value: 'calme', label: 'Calme', icon: '😌', color: 'text-blue-500' },
  { value: 'agite', label: 'Agité', icon: '😤', color: 'text-orange-500' },
  { value: 'triste', label: 'Triste', icon: '😢', color: 'text-red-500' },
  { value: 'fatigue', label: 'Fatigué', icon: '😴', color: 'text-purple-500' }
];

const DailyReportForm: React.FC<DailyReportFormProps> = ({
  childId,
  reportDate = new Date().toISOString().split('T')[0],
  existingReport,
  onSaved
}) => {
  const [availableChildren, setAvailableChildren] = useState<Child[]>([]);
  const [child, setChild] = useState<Child | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formData, setFormData] = useState<DailyReportData>({
    child_id: childId || '',
    report_date: reportDate,
    health_status: 'bien',
    activities: [],
    nap_taken: false,
    breakfast_eaten: 'bien_mange',
    lunch_eaten: 'bien_mange',
    snack_eaten: 'bien_mange',
    hygiene_bath: false,
    hygiene_bowel_movement: false,
    mood: 'calme',
    photos: []
  });
  
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  
  const { toast } = useToast();
  const { profile } = useAuth();

  // Charger la liste des enfants si pas de childId fourni
  useEffect(() => {
    if (!childId && profile) {
      loadAvailableChildren();
    } else if (childId) {
      loadChild(childId);
    }
  }, [childId, profile]);

  // Charger un rapport existant
  useEffect(() => {
    if (existingReport) {
      setFormData({
        ...existingReport,
        photos: []
      });
      setSelectedActivities(existingReport.activities || []);
      setIsDraft(!existingReport.is_validated);
    }
  }, [existingReport]);

  const loadAvailableChildren = async () => {
    try {
      let query = supabase
        .from('children')
        .select('id, first_name, last_name, photo_url, section')
        .eq('status', 'active');

      // Tous les rôles (y compris éducateurs) voient tous les enfants actifs

      const { data, error } = await query.order('first_name');

      if (error) throw error;
      console.log('DailyReportForm - Available children:', data?.length || 0);
      setAvailableChildren(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des enfants:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des enfants",
        variant: "destructive"
      });
    }
  };

  const loadChild = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('id, first_name, last_name, photo_url, section')
        .eq('id', id)
        .single();

      if (error) throw error;
      setChild(data);
      setFormData(prev => ({ ...prev, child_id: id }));
    } catch (error) {
      console.error('Erreur lors du chargement de l\'enfant:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de l'enfant",
        variant: "destructive"
      });
    }
  };

  const handleChildSelection = (childId: string) => {
    const selectedChild = availableChildren.find(c => c.id === childId);
    if (selectedChild) {
      setChild(selectedChild);
      setFormData(prev => ({ ...prev, child_id: childId }));
      setSearchTerm(''); // Réinitialiser la recherche après sélection
    }
  };

  // Filtrer les enfants en fonction du terme de recherche
  const filteredChildren = availableChildren.filter((child) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${child.first_name} ${child.last_name}`.toLowerCase();
    const section = child.section?.toLowerCase() || '';
    return fullName.includes(searchLower) || section.includes(searchLower);
  });

  const handleActivityToggle = (activity: string) => {
    setSelectedActivities(prev => {
      const newActivities = prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity];
      
      setFormData(prevData => ({ ...prevData, activities: newActivities }));
      return newActivities;
    });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPhotoFiles(prev => [...prev, ...files]);
    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const uploadPhotos = async (reportId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of photoFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${reportId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('daily-reports')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('daily-reports')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Erreur upload photo:', error);
        toast({
          title: "Erreur upload",
          description: `Impossible d'uploader ${file.name}`,
          variant: "destructive"
        });
      }
    }

    return uploadedUrls;
  };

  const saveReport = async (sendForValidation = false) => {
    if (!profile || !child) return;

    setIsSubmitting(true);
    
    try {
      // Préparer les données du rapport
      const reportData = {
        child_id: child.id,
        educator_id: profile.id,
        report_date: formData.report_date,
        arrival_time: formData.arrival_time,
        departure_time: formData.departure_time,
        health_status: formData.health_status,
        health_notes: formData.health_notes,
        activities: selectedActivities,
        nap_taken: formData.nap_taken,
        nap_duration_minutes: formData.nap_duration_minutes,
        breakfast_eaten: formData.breakfast_eaten,
        lunch_eaten: formData.lunch_eaten,
        snack_eaten: formData.snack_eaten,
        hygiene_bath: formData.hygiene_bath,
        hygiene_bowel_movement: formData.hygiene_bowel_movement,
        hygiene_frequency_notes: formData.hygiene_frequency_notes,
        mood: formData.mood,
        special_observations: formData.special_observations,
        photos: [] // Will be updated after photo upload
      };

      let reportId: string;

      if (existingReport?.id) {
        // Mettre à jour le rapport existant
        const { error } = await supabase
          .from('daily_reports')
          .update(reportData)
          .eq('id', existingReport.id);

        if (error) throw error;
        reportId = existingReport.id;
      } else {
        // Créer un nouveau rapport
        const { data, error } = await supabase
          .from('daily_reports')
          .insert(reportData)
          .select('id')
          .single();

        if (error) throw error;
        reportId = data.id;
      }

      // Upload des photos si nécessaire
      if (photoFiles.length > 0) {
        const photoUrls = await uploadPhotos(reportId);
        
        if (photoUrls.length > 0) {
          const { error: updateError } = await supabase
            .from('daily_reports')
            .update({ photos: photoUrls })
            .eq('id', reportId);

          if (updateError) throw updateError;
        }
      }

      toast({
        title: sendForValidation ? "Rapport envoyé" : "Rapport sauvegardé",
        description: sendForValidation 
          ? "Le rapport a été envoyé pour validation"
          : "Le rapport a été sauvegardé en brouillon"
      });

      if (onSaved) onSaved();
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le rapport",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!child && childId) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Sélection d'enfant - Étape 1 */}
      {!childId && !child && (
        <>
          {availableChildren.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Aucun enfant disponible</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    Aucun enfant actif n'est disponible pour le moment. 
                    Contactez l'administration pour plus d'informations.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Étape 1: Sélectionnez un enfant
                </CardTitle>
                <CardDescription>
                  Choisissez l'enfant pour lequel vous souhaitez créer un rapport quotidien. 
                  {availableChildren.length} enfant(s) disponible(s).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher un enfant par nom, prénom ou section..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Liste des enfants filtrés */}
                {filteredChildren.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? (
                      <>Aucun enfant trouvé pour "{searchTerm}"</>
                    ) : (
                      <>Aucun enfant disponible</>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredChildren.map((availChild) => (
                    <div
                      key={availChild.id}
                      className="flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all hover:shadow-md"
                      onClick={() => handleChildSelection(availChild.id)}
                    >
                      <Avatar className="h-16 w-16 border-2 border-primary/20">
                        <AvatarImage src={availChild.photo_url} />
                        <AvatarFallback className="bg-primary/10">
                          <Baby className="h-8 w-8 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold text-lg">
                          {availChild.first_name} {availChild.last_name}
                        </div>
                        {availChild.section && (
                          <Badge variant="secondary" className="mt-1">
                            {availChild.section}
                          </Badge>
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                )}
                
                {searchTerm && filteredChildren.length > 0 && (
                  <div className="text-sm text-muted-foreground text-center">
                    {filteredChildren.length} enfant(s) trouvé(s) sur {availableChildren.length}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* En-tête avec info enfant - Étape 2 */}
      {child && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={child.photo_url} />
                    <AvatarFallback>
                      <Baby className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-2xl font-bold">
                      Rapport journalier - {child.first_name} {child.last_name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      {new Date(reportDate).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {child.section && (
                        <Badge variant="outline">{child.section}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {!childId && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setChild(null);
                      setFormData(prev => ({ ...prev, child_id: '' }));
                    }}
                  >
                    Changer d'enfant
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
          </Card>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-900">
              <strong>Étape 2:</strong> Remplissez le formulaire de suivi quotidien ci-dessous. 
              Une fois complété, envoyez-le à l'administration qui le transmettra aux parents.
            </AlertDescription>
          </Alert>
        </>
      )}

      {/* Formulaire principal - Affiché uniquement si un enfant est sélectionné */}
      {child && (
        <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Horaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="arrival_time">Heure d'arrivée</Label>
              <Input
                id="arrival_time"
                type="time"
                value={formData.arrival_time || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, arrival_time: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="departure_time">Heure de départ</Label>
              <Input
                id="departure_time"
                type="time"
                value={formData.departure_time || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, departure_time: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* État de santé */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              État de santé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={formData.health_status}
              onValueChange={(value: 'bien' | 'surveiller' | 'malade') => 
                setFormData(prev => ({ ...prev, health_status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bien">Bien</SelectItem>
                <SelectItem value="surveiller">À surveiller</SelectItem>
                <SelectItem value="malade">Malade</SelectItem>
              </SelectContent>
            </Select>
            
            <div>
              <Label htmlFor="health_notes">Notes de santé (optionnel)</Label>
              <Textarea
                id="health_notes"
                placeholder="Précisions sur l'état de santé..."
                value={formData.health_notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, health_notes: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Repas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Repas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Petit-déjeuner</Label>
              <Select
                value={formData.breakfast_eaten}
                onValueChange={(value: 'bien_mange' | 'peu_mange' | 'rien_mange') => 
                  setFormData(prev => ({ ...prev, breakfast_eaten: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bien_mange">Bien mangé</SelectItem>
                  <SelectItem value="peu_mange">Peu mangé</SelectItem>
                  <SelectItem value="rien_mange">Rien mangé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Déjeuner</Label>
              <Select
                value={formData.lunch_eaten}
                onValueChange={(value: 'bien_mange' | 'peu_mange' | 'rien_mange') => 
                  setFormData(prev => ({ ...prev, lunch_eaten: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bien_mange">Bien mangé</SelectItem>
                  <SelectItem value="peu_mange">Peu mangé</SelectItem>
                  <SelectItem value="rien_mange">Rien mangé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Goûter</Label>
              <Select
                value={formData.snack_eaten}
                onValueChange={(value: 'bien_mange' | 'peu_mange' | 'rien_mange') => 
                  setFormData(prev => ({ ...prev, snack_eaten: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bien_mange">Bien mangé</SelectItem>
                  <SelectItem value="peu_mange">Peu mangé</SelectItem>
                  <SelectItem value="rien_mange">Rien mangé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sieste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              Sieste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="nap_taken"
                checked={formData.nap_taken}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, nap_taken: checked }))}
              />
              <Label htmlFor="nap_taken">A fait la sieste</Label>
            </div>
            
            {formData.nap_taken && (
              <div>
                <Label htmlFor="nap_duration">Durée (en minutes)</Label>
                <Input
                  id="nap_duration"
                  type="number"
                  min="0"
                  max="300"
                  value={formData.nap_duration_minutes || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    nap_duration_minutes: parseInt(e.target.value) || undefined 
                  }))}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hygiène */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Hygiène
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hygiene_bath"
                checked={formData.hygiene_bath}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hygiene_bath: checked }))}
              />
              <Label htmlFor="hygiene_bath">Bain/Toilette</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="hygiene_bowel"
                checked={formData.hygiene_bowel_movement}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hygiene_bowel_movement: checked }))}
              />
              <Label htmlFor="hygiene_bowel">Selles</Label>
            </div>
            
            <div>
              <Label htmlFor="hygiene_notes">Notes sur la fréquence</Label>
              <Textarea
                id="hygiene_notes"
                placeholder="Notes sur l'hygiène..."
                value={formData.hygiene_frequency_notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, hygiene_frequency_notes: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Humeur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5" />
              Humeur du jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {MOOD_OPTIONS.map((mood) => (
                <div
                  key={mood.value}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.mood === mood.value 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, mood: mood.value as any }))}
                >
                  <span className="text-2xl">{mood.icon}</span>
                  <Label className={`cursor-pointer ${mood.color}`}>
                    {mood.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activités */}
      <Card>
        <CardHeader>
          <CardTitle>Activités réalisées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ACTIVITY_OPTIONS.map((activity) => (
              <div
                key={activity}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={activity}
                  checked={selectedActivities.includes(activity)}
                  onCheckedChange={() => handleActivityToggle(activity)}
                />
                <Label htmlFor={activity} className="text-sm cursor-pointer">
                  {activity}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      <Card>
        <CardHeader>
          <CardTitle>Observations particulières</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Notes additionnelles de l'éducatrice..."
            value={formData.special_observations || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, special_observations: e.target.value }))}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photos de la journée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
            />
          </div>
          
          {photoFiles.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {photoFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={() => removePhoto(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => saveReport(false)}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder brouillon
            </Button>
            
            <Button
              onClick={() => saveReport(true)}
              disabled={isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer pour validation
            </Button>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
};

export default DailyReportForm;