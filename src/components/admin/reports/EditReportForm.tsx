import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditReportFormProps {
  report: any;
  onSaved: () => void;
  onCancel: () => void;
}

const ACTIVITY_OPTIONS = [
  'Peinture', 'Dessin', 'Lecture', 'Jeux d\'extérieur', 'Jeux de construction',
  'Musique', 'Chant', 'Danse', 'Jardinage', 'Cuisine', 'Motricité',
  'Jeux d\'eau', 'Puzzle', 'Jeux de société', 'Activité sensorielle'
];

const MOOD_OPTIONS = [
  { value: 'happy', label: 'Joyeux', icon: '😊' },
  { value: 'calm', label: 'Calme', icon: '😌' },
  { value: 'agitated', label: 'Agité', icon: '😤' },
  { value: 'sad', label: 'Triste', icon: '😢' },
  { value: 'tired', label: 'Fatigué', icon: '😴' }
];

const EditReportForm: React.FC<EditReportFormProps> = ({ report, onSaved, onCancel }) => {
  const [formData, setFormData] = useState({
    arrival_time: report.arrival_time || '',
    departure_time: report.departure_time || '',
    health_status: report.health_status || 'well',
    health_notes: report.health_notes || '',
    activities: report.activities || [],
    nap_taken: report.nap_taken || false,
    nap_duration_minutes: report.nap_duration_minutes || '',
    breakfast_eaten: report.breakfast_eaten || 'well',
    lunch_eaten: report.lunch_eaten || 'well',
    snack_eaten: report.snack_eaten || 'well',
    hygiene_bath: report.hygiene_bath || false,
    hygiene_bowel_movement: report.hygiene_bowel_movement || false,
    hygiene_frequency_notes: report.hygiene_frequency_notes || '',
    mood: report.mood || 'happy',
    special_observations: report.special_observations || ''
  });
  
  const [selectedActivities, setSelectedActivities] = useState<string[]>(report.activities || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const handleActivityToggle = (activity: string) => {
    setSelectedActivities(prev => {
      const newActivities = prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity];
      
      setFormData(prevData => ({ ...prevData, activities: newActivities }));
      return newActivities;
    });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('daily_reports')
        .update({
          ...formData,
          activities: selectedActivities
        })
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
              onValueChange={(value) => setFormData(prev => ({ ...prev, health_status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="well">Bien</SelectItem>
                <SelectItem value="monitor">À surveiller</SelectItem>
                <SelectItem value="sick">Malade</SelectItem>
              </SelectContent>
            </Select>
            
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, breakfast_eaten: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="well">Bien mangé</SelectItem>
                  <SelectItem value="little">Peu mangé</SelectItem>
                  <SelectItem value="nothing">Rien mangé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Déjeuner</Label>
              <Select
                value={formData.lunch_eaten}
                onValueChange={(value) => setFormData(prev => ({ ...prev, lunch_eaten: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="well">Bien mangé</SelectItem>
                  <SelectItem value="little">Peu mangé</SelectItem>
                  <SelectItem value="nothing">Rien mangé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Goûter</Label>
              <Select
                value={formData.snack_eaten}
                onValueChange={(value) => setFormData(prev => ({ ...prev, snack_eaten: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="well">Bien mangé</SelectItem>
                  <SelectItem value="little">Peu mangé</SelectItem>
                  <SelectItem value="nothing">Rien mangé</SelectItem>
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
                  value={formData.nap_duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, nap_duration_minutes: parseInt(e.target.value) || 0 }))}
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
            <CardTitle className="text-base">Humeur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <Button
                  key={mood.value}
                  variant={formData.mood === mood.value ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, mood: mood.value }))}
                  className="justify-start"
                >
                  <span className="mr-2">{mood.icon}</span>
                  {mood.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activités */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activités</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ACTIVITY_OPTIONS.map((activity) => (
              <div key={activity} className="flex items-center space-x-2">
                <Checkbox
                  id={`activity-${activity}`}
                  checked={selectedActivities.includes(activity)}
                  onCheckedChange={() => handleActivityToggle(activity)}
                />
                <Label
                  htmlFor={`activity-${activity}`}
                  className="text-sm cursor-pointer"
                >
                  {activity}
                </Label>
              </div>
            ))}
          </div>
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
