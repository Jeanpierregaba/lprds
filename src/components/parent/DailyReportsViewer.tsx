import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar,
  Clock, 
  Heart, 
  Utensils, 
  Bed, 
  Droplets,
  Smile,
  Download,
  Search,
  User,
  Baby,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChildReport {
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
  validated_at: string;
}

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  section?: string;
}

const DailyReportsViewer: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [reports, setReports] = useState<ChildReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ChildReport | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;
  
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    loadChildren();
  }, [profile]);

  useEffect(() => {
    if (selectedChild) {
      loadReports(selectedChild.id);
    }
  }, [selectedChild, dateFilter]);

  const loadChildren = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('children')
        .select(`
          id,
          first_name,
          last_name,
          photo_url,
          section,
          parent_children!inner(parent_id)
        `)
        .eq('parent_children.parent_id', profile.id)
        .eq('status', 'active');

      if (error) throw error;

      const childrenData = data?.map(child => ({
        id: child.id,
        first_name: child.first_name,
        last_name: child.last_name,
        photo_url: child.photo_url,
        section: child.section
      })) || [];

      setChildren(childrenData);
      if (childrenData.length > 0 && !selectedChild) {
        setSelectedChild(childrenData[0]);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des enfants:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos enfants",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async (childId: string) => {
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
          validated_at,
          child:children!child_id (
            id,
            first_name,
            last_name,
            photo_url,
            section
          ),
          educator:profiles!educator_id (
            first_name,
            last_name
          )
        `)
        .eq('child_id', childId)
        .eq('is_validated', true)
        .order('report_date', { ascending: false });

      // Filtrer par date si nécessaire
      if (dateFilter) {
        query = query.eq('report_date', dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transformer les données
      const transformedReports = (data || []).map((report: any) => ({
        ...report,
        child: report.child || {},
        educator: report.educator || {}
      }));
      setReports(transformedReports as ChildReport[]);
      setCurrentPage(1);
      
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les rapports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (report: ChildReport) => {
    toast({
      title: "Génération PDF",
      description: "Fonctionnalité de génération PDF à venir"
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moods: Record<string, string> = {
      joyeux: '😊',
      calme: '😌', 
      agite: '😤',
      triste: '😢',
      fatigue: '😴'
    };
    return moods[mood] || '😊';
  };

  const getMealLabel = (level: string) => {
    const labels: Record<string, string> = {
      bien_mange: 'Bien mangé',
      peu_mange: 'Peu mangé', 
      rien_mange: 'Rien mangé'
    };
    return labels[level] || level;
  };

  const getHealthLabel = (status: string) => {
    const labels: Record<string, string> = {
      bien: 'Bien',
      surveiller: 'À surveiller',
      malade: 'Malade'
    };
    return labels[status] || status;
  };

  // Pagination
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reports.length / reportsPerPage);

  if (loading && !selectedChild) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-white text-3xl font-bold">Rapports Journaliers</h1>
          <p className="text-white">
            Consultez les rapports quotidiens de vos enfants
          </p>
        </div>
      </div>

      {children.length === 0 ? (
        <Alert>
          <Baby className="h-4 w-4" />
          <AlertDescription>
            Aucun enfant trouvé dans votre compte.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sélection enfant + Filtres */}
          <div className="space-y-4">
            
            {/* Sélection enfant */}
            <Card>
              <CardHeader>
                <CardTitle>Mes enfants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChild?.id === child.id 
                        ? 'border-2 border-primary bg-primary/10' 
                        : 'border border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedChild(child)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={child.photo_url} />
                      <AvatarFallback>
                        <Baby className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="font-medium">
                        {child.first_name} {child.last_name}
                      </div>
                      {child.section && (
                        <Badge variant="outline" className="text-xs">
                          {child.section}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Filtres */}
            <Card>
              <CardHeader>
                <CardTitle>Filtres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="date_filter">Filtrer par date</Label>
                  <Input
                    id="date_filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
                
                {dateFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateFilter('')}
                    className="w-full"
                  >
                    Effacer filtre
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Liste des rapports */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Rapports {selectedChild && `- ${selectedChild.first_name}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : reports.length === 0 ? (
                  <Alert>
                    <Search className="h-4 w-4" />
                    <AlertDescription>
                      Aucun rapport trouvé pour les critères sélectionnés.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {currentReports.map((report) => (
                      <div
                        key={report.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedReport?.id === report.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedReport(report)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="font-medium">
                              {new Date(report.report_date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                              })}
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                Éducatrice: {report.educator.first_name} {report.educator.last_name}
                              </div>
                              
                              {report.arrival_time && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {report.arrival_time} - {report.departure_time || '...'}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getMoodEmoji(report.mood)}</span>
                                <Badge variant="outline">
                                  {getHealthLabel(report.health_status)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              generatePDF(report);
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} sur {totalPages}
                        </span>
                        
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Détails du rapport sélectionné */}
          <div className="space-y-4">
            {selectedReport ? (
              <>
                {/* En-tête */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedReport.child.photo_url} />
                          <AvatarFallback>
                            <Baby className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold">
                            {new Date(selectedReport.report_date).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Par {selectedReport.educator.first_name} {selectedReport.educator.last_name}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => generatePDF(selectedReport)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* Détails */}
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    
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
                            {selectedReport.departure_time || 'En cours'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Santé */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Santé
                      </h4>
                      <div className="space-y-2">
                        <Badge variant={selectedReport.health_status === 'well' ? 'default' : 'destructive'}>
                          {getHealthLabel(selectedReport.health_status)}
                        </Badge>
                        {selectedReport.health_notes && (
                          <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                            {selectedReport.health_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Repas */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Utensils className="h-4 w-4" />
                        Repas
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Petit-déjeuner:</span>
                          <span>{getMealLabel(selectedReport.breakfast_eaten)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Déjeuner:</span>
                          <span>{getMealLabel(selectedReport.lunch_eaten)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goûter:</span>
                          <span>{getMealLabel(selectedReport.snack_eaten)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sieste */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Bed className="h-4 w-4" />
                        Sieste
                      </h4>
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
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        Hygiène
                      </h4>
                      <div className="space-y-2 text-sm">
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
                          <div className="text-muted-foreground p-3 bg-muted rounded-lg">
                            {selectedReport.hygiene_frequency_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Humeur */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Smile className="h-4 w-4" />
                        Humeur
                      </h4>
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
                        <h4 className="font-medium mb-2">Observations</h4>
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
                              className="w-full h-32 object-cover rounded-lg cursor-pointer"
                              onClick={() => window.open(photo, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Sélectionner un rapport</h3>
                  <p className="text-muted-foreground">
                    Choisissez un rapport dans la liste pour voir ses détails.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReportsViewer;