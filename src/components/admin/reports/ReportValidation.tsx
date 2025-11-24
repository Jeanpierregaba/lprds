import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  User, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Baby,
  FileText,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import EditReportForm from './EditReportForm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

const ITEMS_PER_PAGE = 10;

const ReportValidation: React.FC = () => {
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<PendingReport | null>(null);
  const [validationNote, setValidationNote] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  // Filtres
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedChild, setSelectedChild] = useState<string>('all');

  // Données pour les filtres
  const [children, setChildren] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    loadPendingReports();
  }, [currentPage, dateFrom, dateTo, searchQuery, selectedSection, selectedChild]);

  const loadChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des enfants:', error);
    }
  };

  const loadPendingReports = async () => {
    try {
      setLoading(true);
      
      // Construire la requête avec les filtres
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

      // Filtres sur daily_reports directement
      if (dateFrom) {
        query = query.gte('report_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('report_date', dateTo);
      }
      if (selectedChild !== 'all') {
        query = query.eq('child_id', selectedChild);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Charger les détails des enfants et éducateurs séparément
      let transformedReports = await Promise.all((data || []).map(async (report: any) => {
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
      })) as PendingReport[];

      // Filtrer par section côté client (car on ne peut pas filtrer directement sur la relation)
      if (selectedSection !== 'all') {
        transformedReports = transformedReports.filter((report) => 
          report.child.section === selectedSection
        );
      }

      // Filtrer par recherche (nom de l'enfant) côté client
      if (searchQuery) {
        transformedReports = transformedReports.filter((report) => {
          const childName = `${report.child.first_name} ${report.child.last_name}`.toLowerCase();
          return childName.includes(searchQuery.toLowerCase());
        });
      }

      // Calculer le nombre total après filtrage côté client
      const filteredCount = transformedReports.length;

      // Appliquer la pagination côté client
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE;
      const paginatedReports = transformedReports.slice(from, to);

      setPendingReports(paginatedReports);
      setTotalReports(filteredCount);
      setTotalPages(Math.ceil(filteredCount / ITEMS_PER_PAGE));
      
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

      // Si le rapport est approuvé, envoyer une notification email aux parents
      if (isApproved) {
        try {
          await supabase.functions.invoke('send-daily-report-notification', {
            body: {
              child_id: selectedReport.child.id,
              report_id: reportId,
              report_date: selectedReport.report_date
            }
          });
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Ne pas faire échouer toute l'opération si l'email échoue
        }
      }

      toast({
        title: isApproved ? "Rapport validé" : "Rapport rejeté",
        description: isApproved 
          ? "Le rapport a été validé et les parents ont été notifiés par email"
          : "Le rapport a été rejeté et retourné à l'éducatrice"
      });

      // Recharger la liste
      loadPendingReports();
      setSelectedReport(null);
      setValidationNote('');
      setIsModalOpen(false);
      setIsEditing(false);
      
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

  const handleEditSaved = () => {
    setIsEditing(false);
    loadPendingReports();
    // Recharger le rapport sélectionné si toujours ouvert
    if (selectedReport) {
      const reloadReport = async () => {
        const { data } = await supabase
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
          .eq('id', selectedReport.id)
          .single();
        
        if (data) {
          const { data: childData } = await supabase
            .from('children')
            .select('id, first_name, last_name, photo_url, section')
            .eq('id', data.child_id)
            .single();
          
          const { data: educatorData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', data.educator_id)
            .single();
          
          setSelectedReport({
            ...data,
            child: childData || {},
            educator: educatorData || {}
          } as PendingReport);
        }
      };
      reloadReport();
    }
  };

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
    setSelectedSection('all');
    setSelectedChild('all');
    setCurrentPage(1);
  };

  const handleOpenModal = (report: PendingReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
    setIsEditing(false);
    setValidationNote('');
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

  const getHealthStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      well: { label: 'Bien', variant: 'default' },
      monitor: { label: 'À surveiller', variant: 'secondary' },
      sick: { label: 'Malade', variant: 'destructive' }
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">Validation des Rapports</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les rapports en attente de validation
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>
            Filtrez les rapports en attente de validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date de début</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Date de fin</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger id="section">
                  <SelectValue placeholder="Toutes les sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sections</SelectItem>
                  <SelectItem value="creche">Crèche</SelectItem>
                  <SelectItem value="garderie">Garderie</SelectItem>
                  <SelectItem value="maternelle_etoile">Maternelle Étoile</SelectItem>
                  <SelectItem value="maternelle_soleil">Maternelle Soleil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="child">Enfant</Label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger id="child">
                  <SelectValue placeholder="Tous les enfants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les enfants</SelectItem>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un enfant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={resetFilters}>
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des rapports */}
      <Card>
        <CardHeader>
          <CardTitle>Rapports en attente de validation</CardTitle>
          <CardDescription>
            {totalReports} rapport{totalReports > 1 ? 's' : ''} trouvé{totalReports > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : pendingReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun rapport en attente de validation</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {pendingReports.map((report) => (
                  <div
                    key={report.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleOpenModal(report)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={report.child.photo_url} />
                          <AvatarFallback>
                            <Baby className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-lg">
                              {report.child.first_name} {report.child.last_name}
                            </h3>
                            {getHealthStatusBadge(report.health_status)}
                            {report.child.section && (
                              <Badge variant="outline">{report.child.section}</Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(report.report_date), 'dd MMM yyyy', { locale: fr })}
                            </div>
                            {report.arrival_time && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Arrivée: {report.arrival_time.slice(0, 5)}
                              </div>
                            )}
                            {report.departure_time && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Départ: {report.departure_time.slice(0, 5)}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {report.educator.first_name} {report.educator.last_name}
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Créé le {format(new Date(report.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} sur {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || loading}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails et validation */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Validation du rapport</DialogTitle>
            {selectedReport && (
              <DialogDescription>
                {selectedReport.child.first_name} {selectedReport.child.last_name} · {format(new Date(selectedReport.report_date), 'dd MMM yyyy', { locale: fr })}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* En-tête avec bouton modifier */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={selectedReport.child.photo_url} />
                    <AvatarFallback>
                      <Baby className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-lg">
                        {selectedReport.child.first_name} {selectedReport.child.last_name}
                      </h3>
                      {getHealthStatusBadge(selectedReport.health_status)}
                      {selectedReport.child.section && (
                        <Badge variant="outline">{selectedReport.child.section}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Créé le {format(new Date(selectedReport.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
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
              </div>

              {/* Mode édition ou affichage */}
              {isEditing ? (
                <EditReportForm
                  report={selectedReport}
                  onSaved={handleEditSaved}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <>
                  {/* Détails du rapport */}
                  <div className="space-y-4">
                    {/* Horaires */}
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
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
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium mb-2">État de santé</h4>
                      <div className="text-sm">
                        {getHealthStatusBadge(selectedReport.health_status)}
                        {selectedReport.health_notes && (
                          <div className="mt-2 text-muted-foreground">
                            {selectedReport.health_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Repas */}
                    <div className="p-4 border rounded-md">
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
                    <div className="p-4 border rounded-md">
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
                    <div className="p-4 border rounded-md">
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
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium mb-2">Humeur</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getMoodEmoji(selectedReport.mood)}</span>
                        <span className="capitalize">{selectedReport.mood}</span>
                      </div>
                    </div>

                    {/* Activités */}
                    {selectedReport.activities && selectedReport.activities.length > 0 && (
                      <div className="p-4 border rounded-md">
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
                      <div className="p-4 border rounded-md bg-muted/30">
                        <h4 className="font-medium mb-2">Observations particulières</h4>
                        <div className="text-sm text-muted-foreground">
                          {selectedReport.special_observations}
                        </div>
                      </div>
                    )}

                    {/* Photos */}
                    {selectedReport.photos && selectedReport.photos.length > 0 && (
                      <div className="p-4 border rounded-md">
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
                  </div>

                  {/* Actions de validation */}
                  <div className="border-t pt-4 space-y-4">
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
                  </div>
                </>
              )}
            </div>
          )}

          {!isEditing && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Fermer</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportValidation;