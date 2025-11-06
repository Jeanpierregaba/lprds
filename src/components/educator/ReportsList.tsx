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
  health_status?: string;
  mood?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  child?: Child;
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

  const fetchReports = useCallback(async () => {
    if (!profile) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          id,
          report_date,
          status,
          health_status,
          mood,
          rejection_reason,
          created_at,
          updated_at,
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

      setReports(data || []);
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
          filteredAndSortedReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onView={onViewReport}
              onEdit={onEditReport}
            />
          ))
        )}
      </div>
    </div>
  );
};
