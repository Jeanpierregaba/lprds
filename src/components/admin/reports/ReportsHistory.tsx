import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Search, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Baby,
  User,
  FileText
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ValidatedReport {
  id: string;
  report_date: string;
  arrival_time?: string;
  departure_time?: string;
  health_status: string;
  temperature_arrival?: number;
  temperature_departure?: number;
  mood: string;
  special_observations?: string;
  validated_at: string;
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
}

const ITEMS_PER_PAGE = 10;

const ReportsHistory = () => {
  const [reports, setReports] = useState<ValidatedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ValidatedReport | null>(null);

  // Filtres
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedChild, setSelectedChild] = useState<string>('all');

  // Données pour les filtres
  const [children, setChildren] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);

  const { toast } = useToast();

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    loadReports();
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

  const loadReports = async () => {
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
          temperature_arrival,
          temperature_departure,
          mood,
          special_observations,
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
        `, { count: 'exact' })
        .eq('is_validated', true);

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

      // Pas de pagination côté serveur car on filtre côté client pour la section et la recherche
      const { data, error } = await query;

      if (error) throw error;

      // Transformer les données
      let transformedReports = (data || []).map((report: any) => ({
        ...report,
        child: report.child || {},
        educator: report.educator || {}
      })) as ValidatedReport[];

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
      console.error('Erreur lors du chargement des rapports:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des rapports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      bien: { label: 'Bien', variant: 'default' },
      surveiller: { label: 'À surveiller', variant: 'secondary' },
      malade: { label: 'Malade', variant: 'destructive' }
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getMoodLabel = (mood: string) => {
    const moodMap: Record<string, string> = {
      joyeux: '😊 Joyeux',
      calme: '😌 Calme',
      agite: '😤 Agité',
      triste: '😢 Triste',
      fatigue: '😴 Fatigué'
    };
    return moodMap[mood] || mood;
  };

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
    setSelectedSection('all');
    setSelectedChild('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>
            Filtrez l'historique des rapports validés
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
          <CardTitle>Historique des rapports validés</CardTitle>
          <CardDescription>
            {totalReports} rapport{totalReports > 1 ? 's' : ''} trouvé{totalReports > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun rapport validé trouvé</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => { setSelectedReport(report); setIsModalOpen(true) }}
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
                            Validé le {format(new Date(report.validated_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
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

      {/* Modal de détails du rapport */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails du rapport validé</DialogTitle>
            {selectedReport && (
              <DialogDescription>
                {selectedReport.child.first_name} {selectedReport.child.last_name} · {format(new Date(selectedReport.report_date), 'dd MMM yyyy', { locale: fr })}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
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
                    Validé le {format(new Date(selectedReport.validated_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2 p-4 border rounded-md">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Date: {format(new Date(selectedReport.report_date), 'dd MMM yyyy', { locale: fr })}</div>
                  {selectedReport.arrival_time && (
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Arrivée: {selectedReport.arrival_time.slice(0,5)}</div>
                  )}
                  {selectedReport.departure_time && (
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Départ: {selectedReport.departure_time.slice(0,5)}</div>
                  )}
                  <div>Humeur: {getMoodLabel(selectedReport.mood)}</div>
                  {typeof selectedReport.temperature_arrival !== 'undefined' && (
                    <div>Temp. arrivée: {selectedReport.temperature_arrival}°C</div>
                  )}
                  {typeof selectedReport.temperature_departure !== 'undefined' && (
                    <div>Temp. départ: {selectedReport.temperature_departure}°C</div>
                  )}
                </div>

                <div className="space-y-2 p-4 border rounded-md">
                  <div className="font-medium">Éducateur</div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" /> {selectedReport.educator.first_name} {selectedReport.educator.last_name}
                  </div>
                </div>
              </div>

              {selectedReport.special_observations && (
                <div className="p-4 border rounded-md bg-muted/30">
                  <div className="font-medium mb-1">Observations particulières</div>
                  <div className="text-sm text-muted-foreground">{selectedReport.special_observations}</div>
                </div>
              )}

              {/* Les activités et photos ne sont pas incluses dans la requête côté historique si volumineuses.
                  Si besoin, on pourrait recharger le rapport par ID pour récupérer 'activities' et 'photos'. */}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsHistory;

