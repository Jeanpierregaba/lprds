import { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Info, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ReportCard } from './ReportCard';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
}

interface Report {
  id: string;
  report_date: string;
  status: 'draft' | 'pending' | 'validated' | 'rejected';
  arrival_time?: string;
  departure_time?: string;
  health_status?: string;
  health_notes?: string;
  temperature_arrival?: number;
  temperature_departure?: number;
  activities: string[];
  nap_taken: boolean;
  nap_duration_minutes?: number;
  breakfast_eaten: string;
  lunch_eaten: string;
  snack_eaten: string;
  hygiene_bath: boolean;
  hygiene_bowel_movement: boolean;
  hygiene_frequency_notes?: string;
  mood?: string | string[];
  special_observations?: string;
  photos?: string[];
  validation_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  child_id: string;
  educator_id: string;
  child?: Child;
}

// Type compatible avec ReportCard
type ReportCardReport = Omit<Report, 'activities' | 'nap_taken' | 'breakfast_eaten' | 'lunch_eaten' | 'snack_eaten' | 'hygiene_bath' | 'hygiene_bowel_movement' | 'hygiene_frequency_notes' | 'special_observations' | 'photos' | 'child_id' | 'educator_id'> & {
  mood?: string; // ReportCard attend string, pas string[]
}

interface ReportsListProps {
  status: 'pending' | 'validated' | 'rejected';
  onViewReport?: (report: Report) => void;
  onEditReport?: (report: Report) => void;
  refreshTrigger?: number;
}

export const ReportsList = ({ 
  status, 
  onViewReport, 
  onEditReport,
  refreshTrigger = 0 
}: ReportsListProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'child'>('date');

  const normalizeMoodValue = (value: string | string[] | null | undefined): string[] => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      return [value];
    }
    return [];
  };

  const fetchReports = useCallback(async () => {
    if (!profile) return;

    try {
      setLoading(true);

      console.log('Fetching reports for educator:', profile.id, 'with status:', status);

      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          id,
          report_date,
          status,
          arrival_time,
          departure_time,
          health_status,
          health_notes,
          temperature_arrival,
          temperature_departure,
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
          validation_notes,
          rejection_reason,
          created_at,
          updated_at,
          child_id,
          educator_id,
          child:children (
            id,
            first_name,
            last_name,
            photo_url
          )
        `)
        .eq('educator_id', profile.id)
        .eq('status', status)
        .order('report_date', { ascending: false });

      if (error) throw error;

      console.log('Reports fetched:', data?.length || 0, 'reports with status:', status);
      console.log('Sample report:', data?.[0]);

      // Map to expected Report type
      const mappedReports: Report[] = (data || []).map(report => ({
        ...report,
        activities: Array.isArray(report.activities) ? report.activities : [],
        mood: normalizeMoodValue(report.mood),
        status: report.status as 'draft' | 'pending' | 'validated' | 'rejected'
      } as Report));

      setReports(mappedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les rapports.'
      });
    } finally {
      setLoading(false);
    }
  }, [profile, status, toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, refreshTrigger]);

  // Filtrage et tri mémorisés
  const filteredAndSortedReports = useMemo(() => {
    let filtered = reports;

    // Filtrage par recherche
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(report => 
        report.child && 
        `${report.child.first_name} ${report.child.last_name}`
          .toLowerCase()
          .includes(searchLower)
      );
    }

    // Tri
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.report_date).getTime() - new Date(a.report_date).getTime();
      } else {
        const nameA = a.child ? `${a.child.first_name} ${a.child.last_name}` : '';
        const nameB = b.child ? `${b.child.first_name} ${b.child.last_name}` : '';
        return nameA.localeCompare(nameB);
      }
    });

    return sorted;
  }, [reports, searchQuery, sortBy]);

  const getEmptyMessage = () => {
    const messages = {
      pending: 'Aucun rapport en attente de validation',
      validated: 'Aucun rapport validé pour le moment',
      rejected: 'Aucun rapport rejeté'
    };
    return messages[status];
  };

  const getInfoMessage = () => {
    const messages = {
      pending: 'Ces rapports ont été soumis et sont en attente de validation par l\'administration.',
      validated: 'Historique de tous vos rapports validés par l\'administration.',
      rejected: 'Ces rapports ont été rejetés et nécessitent des modifications avant d\'être soumis à nouveau.'
    };
    return messages[status];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>{getInfoMessage()}</AlertDescription>
      </Alert>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un enfant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(value: 'date' | 'child') => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date (récent)</SelectItem>
            <SelectItem value="child">Nom de l'enfant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistiques */}
      {reports.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {filteredAndSortedReports.length} rapport(s) trouvé(s)
          {searchQuery && ` pour "${searchQuery}"`}
        </div>
      )}

      {/* Liste des rapports */}
      <div className="space-y-4">
        {filteredAndSortedReports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? 'Aucun rapport ne correspond à votre recherche' : getEmptyMessage()}
            </p>
          </div>
        ) : (
          filteredAndSortedReports.map((report) => {
            // Convertir le rapport en format compatible avec ReportCard
            const reportCardReport: ReportCardReport = {
              ...report,
              mood: Array.isArray(report.mood) ? report.mood.join(', ') : report.mood
            };
            
            return (
              <ReportCard
                key={report.id}
                report={reportCardReport}
                onView={onViewReport}
                onEdit={onEditReport ? () => onEditReport(report) : undefined}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
