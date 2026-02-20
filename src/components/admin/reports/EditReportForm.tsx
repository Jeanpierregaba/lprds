import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Clock, 
  Heart, 
  Utensils, 
  Bed, 
  Droplets,
  Save,
  X,
  Smile
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditReportFormProps {
  report: any;
  onSaved: () => void;
  onCancel: () => void;
}

const MOOD_OPTIONS = [
  { value: 'joyeux', label: 'Joyeux', icon: '😊', color: 'text-green-500' },
  { value: 'calme', label: 'Calme', icon: '😌', color: 'text-blue-500' },
  { value: 'agite', label: 'Agité', icon: '😤', color: 'text-orange-500' },
  { value: 'triste', label: 'Triste', icon: '😢', color: 'text-red-500' },
  { value: 'fatigue', label: 'Fatigué', icon: '😴', color: 'text-purple-500' },
  { value: 'grincheux', label: 'Grincheux', icon: '😠', color: 'text-purple-500' }
];

// Fonction pour normaliser les valeurs mood (support des anciennes valeurs)
const normalizeMoodValue = (value: string | string[] | null | undefined): string[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    // Convertir les anciennes valeurs anglaises si nécessaire
    const moodMap: Record<string, string> = {
      'happy': 'joyeux',
      'calm': 'calme',
      'agitated': 'agite',
      'sad': 'triste',
      'tired': 'fatigue'
    };
    const normalized = moodMap[value] || value;
    return [normalized];
  }
  return [];
};

const EditReportForm: React.FC<EditReportFormProps> = ({ report, onSaved, onCancel }) => {
  // Normaliser les valeurs du rapport existant
  const normalizedMood = normalizeMoodValue(report.mood);
  
  // Normaliser health_status (convertir les anciennes valeurs si nécessaire)
  const normalizeHealthStatus = (status: string | null | undefined): 'bien' | 'surveiller' | 'malade' => {
    if (!status) return 'bien';
    const statusMap: Record<string, 'bien' | 'surveiller' | 'malade'> = {
      'well': 'bien',
      'monitor': 'surveiller',
      'sick': 'malade'
    };
    return statusMap[status] || (status as 'bien' | 'surveiller' | 'malade');
  };

  // Normaliser les valeurs de repas
  const normalizeMealStatus = (status: string | null | undefined): 'bien_mange' | 'peu_mange' | 'rien_mange' => {
    if (!status) return 'bien_mange';
    const mealMap: Record<string, 'bien_mange' | 'peu_mange' | 'rien_mange'> = {
      'well': 'bien_mange',
      'little': 'peu_mange',
      'nothing': 'rien_mange'
    };
    return mealMap[status] || (status as 'bien_mange' | 'peu_mange' | 'rien_mange');
  };

  const [formData, setFormData] = useState({
    arrival_time: report.arrival_time ? (typeof report.arrival_time === 'string' ? report.arrival_time.slice(0, 5) : '') : '',
    departure_time: report.departure_time ? (typeof report.departure_time === 'string' ? report.departure_time.slice(0, 5) : '') : '',
    health_status: normalizeHealthStatus(report.health_status),
    health_notes: report.health_notes || '',
    temperature_arrival: report.temperature_arrival || undefined,
    temperature_departure: report.temperature_departure || undefined,
    activities: Array.isArray(report.activities) ? report.activities : [],
    nap_taken: report.nap_taken || false,
    nap_duration_minutes: report.nap_duration_minutes || undefined,
    breakfast_eaten: normalizeMealStatus(report.breakfast_eaten),
    lunch_eaten: normalizeMealStatus(report.lunch_eaten),
    snack_eaten: normalizeMealStatus(report.snack_eaten),
    hygiene_bath: report.hygiene_bath || false,
    hygiene_bowel_movement: report.hygiene_bowel_movement || false,
    hygiene_frequency_notes: report.hygiene_frequency_notes || '',
    mood: normalizedMood,
    special_observations: report.special_observations || ''
  });
  
  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    Array.isArray(report.activities) ? report.activities : []
  );
  const [newActivity, setNewActivity] = useState<string>('');
  const [existingMedia, setExistingMedia] = useState<string[]>(
    Array.isArray(report.photos) ? report.photos : []
  );
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    setExistingMedia(Array.isArray(report.photos) ? report.photos : []);
    setMediaFiles([]);
  }, [report?.id]);

  const newMediaPreviews = useMemo(() => {
    return mediaFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/')
    }));
  }, [mediaFiles]);

  useEffect(() => {
    return () => {
      newMediaPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [newMediaPreviews]);

  const handleActivityToggle = (activity: string) => {
    setSelectedActivities(prev => {
      const newActivities = prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity];
      
      setFormData(prevData => ({ ...prevData, activities: newActivities }));
      return newActivities;
    });
  };

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

  const toggleMoodSelection = (moodValue: string) => {
    setFormData(prev => {
      const isSelected = prev.mood.includes(moodValue);
      const updatedMood = isSelected
        ? prev.mood.filter(m => m !== moodValue)
        : [...prev.mood, moodValue];
      return { ...prev, mood: updatedMood };
    });
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        toast({
          title: 'Format non supporté',
          description: `Le fichier ${file.name} n'est ni une image ni une vidéo`,
          variant: 'destructive'
        });
        return false;
      }

      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      const maxSizeLabel = isVideo ? '50MB' : '10MB';

      if (file.size > maxSize) {
        toast({
          title: 'Fichier trop volumineux',
          description: `Le fichier ${file.name} dépasse ${maxSizeLabel}`,
          variant: 'destructive'
        });
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...validFiles]);
    }

    event.target.value = '';
  };

  const removeExistingMedia = (url: string) => {
    setExistingMedia(prev => prev.filter(u => u !== url));
  };

  const removeNewMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isVideoUrl = (url: string) => {
    const lower = url.toLowerCase();
    return lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mov') || lower.includes('.m4v') || lower.includes('.ogg');
  };

  const uploadMediaFiles = async (reportId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of mediaFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${reportId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('daily-reports')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('daily-reports')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      const uploadedMediaUrls = mediaFiles.length > 0
        ? await uploadMediaFiles(report.id)
        : [];

      const allMedia = Array.from(new Set([...(existingMedia || []), ...uploadedMediaUrls]));

      const updateData = {
        arrival_time: formData.arrival_time || null,
        departure_time: formData.departure_time || null,
        health_status: formData.health_status,
        health_notes: formData.health_notes || null,
        temperature_arrival: formData.temperature_arrival || null,
        temperature_departure: formData.temperature_departure || null,
        activities: selectedActivities,
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
        photos: allMedia
      };

      const { error } = await supabase
        .from('daily_reports')
        .update(updateData)
        .eq('id', report.id);

      if (error) throw error;

      toast({
        title: "Rapport modifié",
        description: "Les modifications ont été enregistrées"
      });

      onSaved();
      
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rapport",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Modifier le rapport</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Horaires */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="arrival_time">Heure d'arrivée</Label>
              <Input
                id="arrival_time"
                type="time"
                value={formData.arrival_time}
                onChange={(e) => setFormData(prev => ({ ...prev, arrival_time: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="departure_time">Heure de départ</Label>
              <Input
                id="departure_time"
                type="time"
                value={formData.departure_time}
                onChange={(e) => setFormData(prev => ({ ...prev, departure_time: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* État de santé */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4" />
              État de santé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="temperature_arrival">Température à l'arrivée (°C)</Label>
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
                />
              </div>
              
              <div>
                <Label htmlFor="temperature_departure">Température au départ (°C)</Label>
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
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="health_notes">Notes de santé</Label>
              <Textarea
                id="health_notes"
                value={formData.health_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, health_notes: e.target.value }))}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Repas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Repas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
            <CardTitle className="text-base flex items-center gap-2">
              <Bed className="h-4 w-4" />
              Sieste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
                    nap_duration_minutes: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hygiène */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Hygiène
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="hygiene_bath"
                checked={formData.hygiene_bath}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hygiene_bath: checked }))}
              />
              <Label htmlFor="hygiene_bath">Bain</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="hygiene_bowel_movement"
                checked={formData.hygiene_bowel_movement}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hygiene_bowel_movement: checked }))}
              />
              <Label htmlFor="hygiene_bowel_movement">Selles</Label>
            </div>
            
            <div>
              <Label htmlFor="hygiene_notes">Notes</Label>
              <Textarea
                id="hygiene_notes"
                value={formData.hygiene_frequency_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, hygiene_frequency_notes: e.target.value }))}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Humeur */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smile className="h-4 w-4" />
              Humeurs du jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
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
          <CardTitle className="text-base">Activités réalisées</CardTitle>
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

      {/* Observations spéciales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observations spéciales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.special_observations}
            onChange={(e) => setFormData(prev => ({ ...prev, special_observations: e.target.value }))}
            placeholder="Notez ici toute observation particulière..."
            rows={4}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photos & vidéos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin_media_upload">Ajouter des médias</Label>
            <Input
              id="admin_media_upload"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              disabled={isSubmitting}
            />
          </div>

          {(existingMedia.length > 0 || mediaFiles.length > 0) && (
            <div className="space-y-3">
              {existingMedia.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Médias existants</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {existingMedia.map((url) => (
                      <div key={url} className="border rounded-md overflow-hidden">
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          {isVideoUrl(url) ? (
                            <video src={url} className="w-full h-full object-cover" controls />
                          ) : (
                            <img src={url} alt="media" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-2 flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeExistingMedia(url)}
                            disabled={isSubmitting}
                          >
                            Retirer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mediaFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Nouveaux médias</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {newMediaPreviews.map(({ file, url, isVideo }, index) => {
                      return (
                        <div key={`${file.name}-${index}`} className="border rounded-md overflow-hidden">
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            {isVideo ? (
                              <video src={url} className="w-full h-full object-cover" controls />
                            ) : (
                              <img src={url} alt={file.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="p-2 flex items-center justify-between gap-2">
                            <div className="text-xs text-muted-foreground truncate flex-1">
                              {file.name}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeNewMediaFile(index)}
                              disabled={isSubmitting}
                            >
                              Retirer
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </div>
  );
};

export default EditReportForm;
