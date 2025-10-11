import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  User, 
  Calendar,
  MessageSquare,
  Download,
  Filter,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import EditReportForm from './EditReportForm';

interface PendingReport {
  id: string;
  report_date: string;
  child: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string;
    section?: string;
  };
  educator: {
    first_name: string;
    last_name: string;
  };
  arrival_time?: string;
  departure_time?: string;
  health_status: string;
  health_notes?: string;
  activities: string[];
  nap_taken: boolean;
  nap_duration_minutes?: number;
  breakfast_eaten: string;
  lunch_eaten: string;
  snack_eaten: string;
  hygiene_bath: boolean;
  hygiene_bowel_movement: boolean;
  hygiene_frequency_notes?: string;
  mood: string;
  special_observations?: string;
  photos?: string[];
  created_at: string;
}

const ReportValidation: React.FC = () => {
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<PendingReport | null>(null);
  const [validationNote, setValidationNote] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('today');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    loadPendingReports();
  }, [filter]);

  const loadPendingReports = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('daily_reports')
        .select(`
          id,
          report_date,
          arrival_time,
          departure_time,
          health_status,
          health_notes,
          activities,
          nap_taken,
          nap_duration_minutes,
          breakfast_eaten,
          lunch_eaten,
          snack_eaten,
          hygiene_bath,
          hygiene_bowel_movement,
          hygiene_frequency_notes,
          mood,
          special_observations,
          photos,
          created_at,
          child_id,
          educator_id
        `)
        .eq('is_validated', false)
        .order('created_at', { ascending: false });

      // Filtrer par date selon le filtre sélectionné
      const now = new Date();
      if (filter === 'today') {
        const today = now.toISOString().split('T')[0];
        query = query.eq('report_date', today);
      } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        query = query.gte('report_date', weekAgo.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Charger les détails des enfants et éducateurs séparément
      const transformedReports = await Promise.all((data || []).map(async (report: any) => {
        // Charger l'enfant
        const { data: childData } = await supabase
          .from('children')
          .select('id, first_name, last_name, photo_url, section')
          .eq('id', report.child_id)
          .single();

        // Charger l'éducateur
        const { data: educatorData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', report.educator_id)
          .single();

        return {
          ...report,
          child: childData || {},
          educator: educatorData || {}
        };
      }));

      setPendingReports(transformedReports as PendingReport[]);
      
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les rapports en attente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateReport = async (reportId: string, isApproved: boolean) => {
    if (!profile || !selectedReport) return;

    setIsValidating(true);
    
    try {
      const { error } = await supabase
        .from('daily_reports')
        .update({
          is_validated: isApproved,
          validated_by: profile.id,
          validated_at: new Date().toISOString(),
          validation_notes: validationNote || null
        })
        .eq('id', reportId);

      if (error) throw error;

      // Si le rapport est approuvé, envoyer un message au parent
      if (isApproved) {
        await sendReportToParent(selectedReport);
      }

      toast({
        title: isApproved ? "Rapport validé" : "Rapport rejeté",
        description: isApproved 
          ? "Le rapport a été validé et un message a été envoyé au parent"
          : "Le rapport a été rejeté et retourné à l'éducatrice"
      });

      // Recharger la liste
      loadPendingReports();
      setSelectedReport(null);
      setValidationNote('');
      
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider le rapport",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const sendReportToParent = async (report: PendingReport) => {
    try {
      // Récupérer les parents de l'enfant
      const { data: parentLinks, error: parentError } = await supabase
        .from('parent_children')
        .select('parent_id')
        .eq('child_id', report.child.id);

      if (parentError) throw parentError;

      // Créer un message pour chaque parent
      for (const link of parentLinks || []) {
        const messageContent = `
Nouveau rapport journalier disponible pour ${report.child.first_name} ${report.child.last_name}

Date: ${new Date(report.report_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

${validationNote ? `Note de validation: ${validationNote}` : ''}

Consultez l'onglet "Rapports journaliers" pour voir tous les détails.
        `.trim();

        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            sender_id: profile!.id,
            recipient_id: link.parent_id,
            child_id: report.child.id,
            subject: `Rapport journalier - ${report.child.first_name} ${report.child.last_name}`,
            content: messageContent
          });

        if (messageError) throw messageError;
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      // Ne pas bloquer la validation si l'envoi du message échoue
      toast({
        title: "Attention",
        description: "Le rapport a été validé mais l'envoi du message a échoué",
        variant: "destructive"
      });
    }
  };

  const handleEditSaved = () => {
    setIsEditing(false);
    loadPendingReports();
  };

  const getMoodEmoji = (mood: string) => {
    const moods: Record<string, string> = {
      happy: '😊',
      calm: '😌',
      agitated: '😤',
      sad: '😢',
      tired: '😴'
    };
    return moods[mood] || '😊';
  };

  const getMealLabel = (level: string) => {
    const labels: Record<string, string> = {
      well: 'Bien mangé',
      little: 'Peu mangé',
      nothing: 'Rien mangé'
    };
    return labels[level] || level;
  };

  const getHealthLabel = (status: string) => {
    const labels: Record<string, string> = {
      well: 'Bien',
      monitor: 'À surveiller',
      sick: 'Malade'
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="p-6">Chargement des rapports...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Validation des Rapports</h1>
          <p className="text-muted-foreground">
            {pendingReports.length} rapport(s) en attente de validation
          </p>
        </div>
        
        <div className="flex gap-2">
          {(['today', 'week', 'all'] as const).map((filterValue) => (
            <Button
              key={filterValue}
              variant={filter === filterValue ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterValue)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {filterValue === 'today' ? 'Aujourd\'hui' : 
               filterValue === 'week' ? 'Cette semaine' : 'Tous'}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Liste des rapports en attente */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports en attente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingReports.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucun rapport en attente de validation pour la période sélectionnée.
                  </AlertDescription>
                </Alert>
              ) : (
                pendingReports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedReport?.id === report.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={report.child.photo_url} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {report.child.first_name} {report.child.last_name}
                          </span>
                          {report.child.section && (
                            <Badge variant="outline" className="text-xs">
                              {report.child.section}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(report.report_date).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {report.educator.first_name} {report.educator.last_name}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {new Date(report.created_at).toLocaleTimeString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Détails du rapport sélectionné */}
        <div className="space-y-4">
          {selectedReport ? (
            <>
              {/* En-tête du rapport */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedReport.child.photo_url} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-xl">
                          {selectedReport.child.first_name} {selectedReport.child.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(selectedReport.report_date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Mode édition ou affichage */}
              {isEditing ? (
                <EditReportForm
                  report={selectedReport}
                  onSaved={handleEditSaved}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <>
                  {/* Contenu du rapport */}
                  <Card>
                <CardHeader>
                  <CardTitle>Détails du rapport</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Horaires */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Horaires
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Arrivée:</span>
                        <div className="font-medium">
                          {selectedReport.arrival_time || 'Non renseigné'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Départ:</span>
                        <div className="font-medium">
                          {selectedReport.departure_time || 'Non renseigné'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Santé */}
                  <div>
                    <h4 className="font-medium mb-2">État de santé</h4>
                    <div className="text-sm">
                      <Badge variant={selectedReport.health_status === 'well' ? 'default' : 'destructive'}>
                        {getHealthLabel(selectedReport.health_status)}
                      </Badge>
                      {selectedReport.health_notes && (
                        <div className="mt-2 text-muted-foreground">
                          {selectedReport.health_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Repas */}
                  <div>
                    <h4 className="font-medium mb-2">Repas</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Petit-déj:</span>
                        <div>{getMealLabel(selectedReport.breakfast_eaten)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Déjeuner:</span>
                        <div>{getMealLabel(selectedReport.lunch_eaten)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Goûter:</span>
                        <div>{getMealLabel(selectedReport.snack_eaten)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Sieste */}
                  <div>
                    <h4 className="font-medium mb-2">Sieste</h4>
                    <div className="text-sm">
                      {selectedReport.nap_taken ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="default">A fait la sieste</Badge>
                          {selectedReport.nap_duration_minutes && (
                            <span className="text-muted-foreground">
                              ({selectedReport.nap_duration_minutes} min)
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">Pas de sieste</Badge>
                      )}
                    </div>
                  </div>

                  {/* Hygiène */}
                  <div>
                    <h4 className="font-medium mb-2">Hygiène</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Bain:</span>
                          <Badge variant={selectedReport.hygiene_bath ? 'default' : 'outline'}>
                            {selectedReport.hygiene_bath ? 'Oui' : 'Non'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Selles:</span>
                          <Badge variant={selectedReport.hygiene_bowel_movement ? 'default' : 'outline'}>
                            {selectedReport.hygiene_bowel_movement ? 'Oui' : 'Non'}
                          </Badge>
                        </div>
                      </div>
                      {selectedReport.hygiene_frequency_notes && (
                        <div className="text-muted-foreground">
                          {selectedReport.hygiene_frequency_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Humeur */}
                  <div>
                    <h4 className="font-medium mb-2">Humeur</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getMoodEmoji(selectedReport.mood)}</span>
                      <span className="capitalize">{selectedReport.mood}</span>
                    </div>
                  </div>

                  {/* Activités */}
                  {selectedReport.activities && selectedReport.activities.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Activités</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedReport.activities.map((activity, index) => (
                          <Badge key={index} variant="outline">
                            {activity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observations */}
                  {selectedReport.special_observations && (
                    <div>
                      <h4 className="font-medium mb-2">Observations particulières</h4>
                      <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                        {selectedReport.special_observations}
                      </div>
                    </div>
                  )}

                  {/* Photos */}
                  {selectedReport.photos && selectedReport.photos.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Photos ({selectedReport.photos.length})</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedReport.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions de validation */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions de validation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="validation_note">Note de validation (optionnelle)</Label>
                    <Textarea
                      id="validation_note"
                      placeholder="Commentaires ou demandes de modification..."
                      value={validationNote}
                      onChange={(e) => setValidationNote(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      onClick={() => validateReport(selectedReport.id, false)}
                      disabled={isValidating}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                    
                    <Button
                      onClick={() => validateReport(selectedReport.id, true)}
                      disabled={isValidating}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider
                    </Button>
                  </div>
                </CardContent>
              </Card>
                </>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Sélectionnez un rapport pour voir les détails
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportValidation;