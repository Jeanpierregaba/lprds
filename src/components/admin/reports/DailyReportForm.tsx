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
  Video,
  Save,
  Send,
  User,
  CalendarDays,
  Smile,
  Meh,
  Frown,
  Baby,
  Search,
  CheckCircle,
  Play
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
  temperature_arrival?: number;
  temperature_departure?: number;
  activities: string[];
  nap_taken: boolean;
  nap_duration_minutes?: number;
  breakfast_eaten: 'bien_mange' | 'peu_mange' | 'rien_mange';
  lunch_eaten: 'bien_mange' | 'peu_mange' | 'rien_mange';
  snack_eaten: 'bien_mange' | 'peu_mange' | 'rien_mange';
  hygiene_bath: boolean;
  hygiene_bowel_movement: boolean;
  hygiene_frequency_notes?: string;
  mood: string[];
  special_observations?: string;
  photos: File[];
}

interface DailyReportFormProps {
  childId?: string;
  reportDate?: string;
  existingReport?: any;
  onSaved?: () => void;
  restrictToAssigned?: boolean; // Quand true pour un éducateur, limite aux enfants de son groupe
}

const MOOD_OPTIONS = [
  { value: 'joyeux', label: 'Joyeux', icon: '😊', color: 'text-green-500' },
  { value: 'calme', label: 'Calme', icon: '😌', color: 'text-blue-500' },
  { value: 'agite', label: 'Agité', icon: '😤', color: 'text-orange-500' },
  { value: 'triste', label: 'Triste', icon: '😢', color: 'text-red-500' },
  { value: 'fatigue', label: 'Fatigué', icon: '😴', color: 'text-purple-500' },
  { value: 'grincheux', label: 'Grincheux', icon: '😠', color: 'text-purple-500' }
];

const DailyReportForm: React.FC<DailyReportFormProps> = ({
  childId,
  reportDate = new Date().toISOString().split('T')[0],
  existingReport,
  onSaved,
  restrictToAssigned = false
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
    mood: [],
    photos: []
  });
  
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [newActivity, setNewActivity] = useState<string>('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  
  const { toast } = useToast();
  const { profile } = useAuth();

  const normalizeMoodValue = (value: string | string[] | null | undefined): string[] => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      return [value];
    }
    return [];
  };

  const toggleMoodSelection = (moodValue: string) => {
    setFormData(prev => {
      const isSelected = prev.mood.includes(moodValue);
      const updatedMood = isSelected
        ? prev.mood.filter(m => m !== moodValue)
        : [...prev.mood, moodValue];
      return { ...prev, mood: updatedMood };
    });
  };

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
      // Si le rapport a un enfant associé, charger cet enfant
      if (existingReport.child) {
        setChild(existingReport.child);
      } else if (existingReport.child_id && !child) {
        loadChild(existingReport.child_id);
      }
      
      setFormData({
        ...existingReport,
        mood: normalizeMoodValue(existingReport.mood),
        photos: [] // Les photos existantes sont des URLs, on les met dans formData mais pas dans photos File[]
      });
      setSelectedActivities(existingReport.activities || []);
      setIsDraft(existingReport.is_draft !== false);
    }
  }, [existingReport]);

  // Charger automatiquement les horaires et températures d'arrivée/départ depuis la présence scannée
  useEffect(() => {
    const loadAttendanceData = async () => {
      if (!child || !reportDate) return;
      try {
        const { data, error } = await supabase
          .from('daily_attendance')
          .select('arrival_time, departure_time, arrival_temperature, departure_temperature')
          .eq('child_id', child.id)
          .eq('attendance_date', reportDate)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const toTimeInput = (t?: string | null) => (t ? t.slice(0, 5) : '');
          setFormData(prev => ({
            ...prev,
            arrival_time: data.arrival_time ? toTimeInput(data.arrival_time) : prev.arrival_time,
            departure_time: data.departure_time ? toTimeInput(data.departure_time) : prev.departure_time,
            temperature_arrival: data.arrival_temperature ?? prev.temperature_arrival,
            temperature_departure: data.departure_temperature ?? prev.temperature_departure,
          }));
        }
      } catch (err) {
        console.error('Erreur chargement données de présence:', err);
      }
    };

    loadAttendanceData();
  }, [child?.id, reportDate]);

  const loadAvailableChildren = async () => {
    try {
      let query = supabase
        .from('children')
        .select('id, first_name, last_name, photo_url, section')
        .eq('status', 'active');

      // Si éducateur et restriction activée, limiter aux enfants de son groupe
      if (profile?.role === 'educator' && restrictToAssigned) {
        const { data: educatorGroup, error: groupError } = await supabase
          .from('groups')
          .select('id')
          .eq('assigned_educator_id', profile.id)
          .single();

        if (groupError || !educatorGroup) {
          setAvailableChildren([]);
          return;
        }

        query = query.eq('group_id', educatorGroup.id);
      }

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

  const handleAddActivity = () => {
    if (newActivity.trim()) {
      const activity = newActivity.trim();
      if (!selectedActivities.includes(activity)) {
        const newActivities = [...selectedActivities, activity];
        setSelectedActivities(newActivities);
        setFormData(prevData => ({ ...prevData, activities: newActivities }));
      }
      setNewActivity('');
    }
  };

  const handleRemoveActivity = (activity: string) => {
    const newActivities = selectedActivities.filter(a => a !== activity);
    setSelectedActivities(newActivities);
    setFormData(prevData => ({ ...prevData, activities: newActivities }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validation des fichiers (images et vidéos)
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast({
          title: "Format non supporté",
          description: `Le fichier ${file.name} n'est ni une image ni une vidéo`,
          variant: "destructive"
        });
        return false;
      }
      
      // Limiter la taille : 10MB pour images, 50MB pour vidéos
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      const maxSizeLabel = isVideo ? '50MB' : '10MB';
      
      if (file.size > maxSize) {
        toast({
          title: "Fichier trop volumineux",
          description: `Le fichier ${file.name} dépasse ${maxSizeLabel}`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setPhotoFiles(prev => [...prev, ...validFiles]);
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...validFiles] }));
    }

    // Réinitialiser l'input pour permettre de sélectionner le même fichier à nouveau
    event.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const uploadMediaFiles = async (reportId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of photoFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${reportId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const fileType = file.type.startsWith('video/') ? 'vidéo' : 'photo';

        console.log(`Tentative d'upload ${fileType}:`, fileName, 'Taille:', file.size, 'Type:', file.type);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('daily-reports')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`Erreur détaillée upload ${fileType}:`, uploadError);
          throw uploadError;
        }

        console.log(`Upload ${fileType} réussi:`, uploadData);

        const { data: { publicUrl } } = supabase.storage
          .from('daily-reports')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      } catch (error: any) {
        console.error('Erreur upload média:', error);
        const errorMessage = error?.message || error?.error || 'Erreur inconnue';
        const fileType = file.type.startsWith('video/') ? 'la vidéo' : 'la photo';
        toast({
          title: "Erreur upload",
          description: `Impossible d'uploader ${fileType} ${file.name}: ${errorMessage}`,
          variant: "destructive"
        });
      }
    }

    return uploadedUrls;
  };

  const saveReport = async (sendForValidation = false) => {
    if (!profile || !child) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un enfant",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Préparer les données du rapport
      const activitiesCombined = [...selectedActivities];

      const reportData = {
        child_id: child.id,
        educator_id: profile.id,
        report_date: formData.report_date,
        arrival_time: formData.arrival_time || null,
        departure_time: formData.departure_time || null,
        health_status: formData.health_status,
        health_notes: formData.health_notes || null,
        temperature_arrival: formData.temperature_arrival || null,
        temperature_departure: formData.temperature_departure || null,
        activities: activitiesCombined,
        nap_taken: formData.nap_taken,
        nap_duration_minutes: formData.nap_duration_minutes || null,
        breakfast_eaten: formData.breakfast_eaten,
        lunch_eaten: formData.lunch_eaten,
        snack_eaten: formData.snack_eaten,
        hygiene_bath: formData.hygiene_bath,
        hygiene_bowel_movement: formData.hygiene_bowel_movement,
        hygiene_frequency_notes: formData.hygiene_frequency_notes || null,
        mood: formData.mood,
        special_observations: formData.special_observations || null,
        photos: [],
        is_draft: !sendForValidation,
        is_validated: false
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
        // Vérifier si un rapport existe déjà pour cet enfant à cette date
        const { data: existingReportCheck } = await supabase
          .from('daily_reports')
          .select('id')
          .eq('child_id', child.id)
          .eq('report_date', formData.report_date)
          .maybeSingle();

        if (existingReportCheck) {
          // Un rapport existe déjà, le mettre à jour au lieu de créer un nouveau
          const { error } = await supabase
            .from('daily_reports')
            .update(reportData)
            .eq('id', existingReportCheck.id);

          if (error) throw error;
          reportId = existingReportCheck.id;
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
      }

      // Upload des photos et vidéos si nécessaire
      if (photoFiles.length > 0) {
        const mediaUrls = await uploadMediaFiles(reportId);
        
        if (mediaUrls.length > 0) {
          // Récupérer les médias existants pour les fusionner avec les nouveaux
          let existingMedia: string[] = [];
          if (existingReport?.id) {
            const { data: existingReportData } = await supabase
              .from('daily_reports')
              .select('photos')
              .eq('id', reportId)
              .single();
            
            if (existingReportData?.photos && Array.isArray(existingReportData.photos)) {
              existingMedia = existingReportData.photos as string[];
            }
          }

          // Fusionner les médias existants avec les nouveaux (éviter les doublons)
          const allMedia = Array.from(new Set([...existingMedia, ...mediaUrls]));
          
          const { error: updateError } = await supabase
            .from('daily_reports')
            .update({ photos: allMedia })
            .eq('id', reportId);

          if (updateError) throw updateError;
        }
      }

      // La notification email sera envoyée uniquement après validation par l'administration

      toast({
        title: sendForValidation ? "Rapport envoyé" : "Rapport sauvegardé",
        description: sendForValidation 
          ? "Le rapport a été envoyé pour validation"
          : "Le rapport a été sauvegardé en brouillon"
      });

      // Réinitialiser le formulaire après sauvegarde réussie
      if (!existingReport) {
        setPhotoFiles([]);
        setFormData(prev => ({ ...prev, photos: [] }));
        setSelectedActivities([]);
        setChild(null);
        setSearchTerm('');
      }

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

          {(formData.arrival_time || formData.departure_time || formData.temperature_arrival || formData.temperature_departure) && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-900">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm sm:text-base">
                    Les horaires et températures ont été chargés automatiquement depuis le pointage QR de l'enfant.
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}
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
              <Label htmlFor="arrival_time" className="text-sm sm:text-base flex items-center gap-2">
                <span>Heure d'arrivée</span>
                {formData.arrival_time && (
                  <Badge variant="secondary" className="text-xs">Auto</Badge>
                )}
              </Label>
              <Input
                id="arrival_time"
                type="time"
                value={formData.arrival_time || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, arrival_time: e.target.value }))}
                className={formData.arrival_time ? "border-green-300 bg-green-50/50" : ""}
              />
            </div>
            <div>
              <Label htmlFor="departure_time" className="text-sm sm:text-base flex items-center gap-2">
                <span>Heure de départ</span>
                {formData.departure_time && (
                  <Badge variant="secondary" className="text-xs">Auto</Badge>
                )}
              </Label>
              <Input
                id="departure_time"
                type="time"
                value={formData.departure_time || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, departure_time: e.target.value }))}
                className={formData.departure_time ? "border-green-300 bg-green-50/50" : ""}
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temperature_arrival" className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
                  <span>Température à l'arrivée (°C)</span>
                  {formData.temperature_arrival && (
                    <Badge variant="secondary" className="text-xs">Auto</Badge>
                  )}
                </Label>
                <Input
                  id="temperature_arrival"
                  type="number"
                  step="0.1"
                  min="30"
                  max="45"
                  placeholder="37.0"
                  value={formData.temperature_arrival || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    temperature_arrival: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  className={formData.temperature_arrival ? "border-green-300 bg-green-50/50" : ""}
                />
              </div>
              
              <div>
                <Label htmlFor="temperature_departure" className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
                  <span>Température au départ (°C)</span>
                  {formData.temperature_departure && (
                    <Badge variant="secondary" className="text-xs">Auto</Badge>
                  )}
                </Label>
                <Input
                  id="temperature_departure"
                  type="number"
                  step="0.1"
                  min="30"
                  max="45"
                  placeholder="37.0"
                  value={formData.temperature_departure || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    temperature_departure: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  className={formData.temperature_departure ? "border-green-300 bg-green-50/50" : ""}
                />
              </div>
            </div>
            
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
              <Label htmlFor="hygiene_bowel">Popo</Label>
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
              Humeurs du jour
            </CardTitle>
            <CardDescription>
              Sélectionnez une ou plusieurs humeurs observées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {MOOD_OPTIONS.map((mood) => (
                <div
                  key={mood.value}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.mood.includes(mood.value)
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => toggleMoodSelection(mood.value)}
                >
                  <Checkbox
                    checked={formData.mood.includes(mood.value)}
                    onCheckedChange={() => toggleMoodSelection(mood.value)}
                    onClick={(event) => event.stopPropagation()}
                  />
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
          <CardDescription>
            Ajoutez les activités réalisées par l'enfant durant la journée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Champ d'ajout d'activité */}
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Peinture, Lecture, Jeux d'extérieur..."
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddActivity();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddActivity}
              size="icon"
              variant="default"
            >
              +
            </Button>
          </div>

          {/* Liste des activités ajoutées */}
          {selectedActivities.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Activités de la journée :</Label>
              <div className="flex flex-wrap gap-2">
                {selectedActivities.map((activity, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-sm px-3 py-1 flex items-center gap-2"
                  >
                    {activity}
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(activity)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
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

      {/* Photos et Vidéos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <Video className="h-5 w-5" />
            Photos et Vidéos de la journée
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Images (max 10MB) • Vidéos (max 50MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handlePhotoUpload}
            />
          </div>
          
          {photoFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photoFiles.map((file, index) => {
                const isVideo = file.type.startsWith('video/');
                const fileUrl = URL.createObjectURL(file);
                
                return (
                  <div key={index} className="relative group">
                    {isVideo ? (
                      <div className="relative w-full h-24 bg-gray-900 rounded-lg overflow-hidden">
                        <video
                          src={fileUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="absolute bottom-1 left-1 text-xs"
                        >
                          Vidéo
                        </Badge>
                      </div>
                    ) : (
                      <img
                        src={fileUrl}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      onClick={() => removePhoto(index)}
                    >
                      ×
                    </Button>
                  </div>
                );
              })}
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