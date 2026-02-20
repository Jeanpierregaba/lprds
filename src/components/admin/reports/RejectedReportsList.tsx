import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Info, 
  Loader2, 
  Eye, 
  Edit,
  XCircle,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  section?: string;
}

interface Educator {
  first_name: string;
  last_name: string;
}

interface RejectedReport {
  id: string;
  report_date: string;
  status: 'rejected';
  health_status?: string;
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
  mood: string | string[];
  special_observations?: string;
  photos?: string[];
  rejection_reason?: string;
  validation_notes?: string;
  created_at: string;
  updated_at: string;
  child?: Child;
  educator?: Educator;
}

const ITEMS_PER_PAGE = 10;

const RejectedReportsList: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<RejectedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'child'>('date');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  // Filtres
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedChild, setSelectedChild] = useState<string>('all');

  // Données pour les filtres
  const [children, setChildren] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    loadRejectedReports();
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

  const loadRejectedReports = async () => {
    try {
      setLoading(true);
      
      // Construire la requête avec les filtres
      let query = supabase
        .from('daily_reports')
        .select(`
          id,
          report_date,
          status,
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
          rejection_reason,
          validation_notes,
          created_at,
          updated_at,
          child_id,
          educator_id
        `)
        .eq('status', 'rejected')
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
      })) as RejectedReport[];

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

      setReports(paginatedReports);
      setTotalReports(filteredCount);
      setTotalPages(Math.ceil(filteredCount / ITEMS_PER_PAGE));
      
    } catch (error) {
      console.error('Erreur lors du chargement des rapports rejetés:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les rapports rejetés",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  // Filtrage et tri mémorisés
  const filteredAndSortedReports = useMemo(() => {
    // Les rapports sont déjà filtrés et paginés dans loadRejectedReports
    return reports;
  }, [reports]);

  const getHealthStatusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      'bien': 'En bonne santé',
      'surveiller': 'À surveiller',
      'malade': 'Malade'
    };
    return status ? labels[status] || status : 'Non renseigné';
  };

  const getMoodEmoji = (mood: string | string[]) => {
    const moods: Record<string, string> = {
      'joyeux': '😊',
      'calme': '😌',
      'agite': '😤',
      'triste': '😢',
      'fatigue': '😴'
    };
    
    if (Array.isArray(mood)) {
      return mood.map(m => moods[m] || '😊').join(' ');
    }
    return moods[mood] || '😊';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement des rapports rejetés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">Rapports Rejetés</h1>
        <p className="text-muted-foreground mt-2">
          Consultez les rapports qui ont été rejetés et nécessitent des modifications
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>
            Filtrez les rapports rejetés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label htmlFor="dateFrom">Date de début</label>
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
              <label htmlFor="dateTo">Date de fin</label>
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
              <label htmlFor="section">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger id="section">
                  <SelectValue placeholder="Toutes les sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sections</SelectItem>
                  <SelectItem value="creche">Crèche</SelectItem>
                  <SelectItem value="garderie">Garderie</SelectItem>
                  <SelectItem value="maternelle">Maternelle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="child">Enfant</label>
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
          <CardTitle>Rapports rejetés</CardTitle>
          <CardDescription>
            {totalReports} rapport{totalReports > 1 ? 's' : ''} rejeté{totalReports > 1 ? 's' : ''} trouvé{totalReports > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAndSortedReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun rapport rejeté trouvé</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredAndSortedReports.map((report) => (
                  <div
                    key={report.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={report.child.photo_url} />
                          <AvatarFallback>
                            {report.child.first_name?.charAt(0)}{report.child.last_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-lg">
                              {report.child.first_name} {report.child.last_name}
                            </h3>
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Rejeté
                            </Badge>
                            {report.child.section && (
                              <Badge variant="outline">{report.child.section}</Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(report.report_date), 'dd MMM yyyy', { locale: fr })}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {report.educator.first_name} {report.educator.last_name}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getMoodEmoji(report.mood)}</span>
                              <span>{getHealthStatusLabel(report.health_status)}</span>
                            </div>
                            <div className="text-xs">
                              Rejeté le {format(new Date(report.updated_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </div>
                          </div>

                          {/* Raison du rejet */}
                          {report.rejection_reason && (
                            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                              <div className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                    Raison du rejet
                                  </p>
                                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    {report.rejection_reason}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
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
    </div>
  );
};

export default RejectedReportsList;
