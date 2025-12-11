import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download,
  Sun,
  Star,
  Cloud,
  Eye,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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
  id: string;
  first_name: string;
  last_name: string;
}

interface AssessmentDomain {
  domain: string;
  rating: 'acquis' | 'en_cours' | 'a_consolider';
  comment: string;
}

interface Assessment {
  id: string;
  child_id: string;
  educator_id: string;
  period_name: string;
  school_year: string;
  assessment_date: string;
  domains: AssessmentDomain[];
  teacher_comment?: string;
  status: string;
  is_validated: boolean;
  created_at: string;
  child?: Child;
  educator?: Educator;
}

const RATING_OPTIONS = [
  { value: 'acquis', label: 'Acquis', icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  { value: 'en_cours', label: 'En cours d\'acquisition', icon: Star, color: 'text-orange-500', bg: 'bg-orange-100' },
  { value: 'a_consolider', label: 'À consolider', icon: Cloud, color: 'text-blue-400', bg: 'bg-blue-100' }
];

const ParentAssessmentsPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchChildren();
    }
  }, [profile]);

  useEffect(() => {
    if (children.length > 0) {
      fetchAssessments();
    }
  }, [children, selectedChildId]);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('parent_children')
        .select(`
          child:children(id, first_name, last_name, photo_url, section)
        `)
        .eq('parent_id', profile?.id);

      if (error) throw error;
      
      const childrenList = (data || [])
        .map(pc => pc.child)
        .filter(Boolean) as Child[];
      
      setChildren(childrenList);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('periodic_assessments')
        .select(`
          *,
          child:children(id, first_name, last_name, photo_url, section),
          educator:profiles!periodic_assessments_educator_id_fkey(id, first_name, last_name)
        `)
        .eq('is_validated', true)
        .order('assessment_date', { ascending: false });

      const childIds = children.map(c => c.id);
      
      if (selectedChildId !== 'all') {
        query = query.eq('child_id', selectedChildId);
      } else {
        query = query.in('child_id', childIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        domains: (Array.isArray(item.domains) ? item.domains : []) as unknown as AssessmentDomain[]
      }));
      
      setAssessments(transformedData as Assessment[]);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingDisplay = (rating: string) => {
    const option = RATING_OPTIONS.find(r => r.value === rating);
    if (!option) return null;
    const Icon = option.icon;
    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${option.bg}`}>
        <Icon className={`w-5 h-5 ${option.color}`} />
        <span className="text-sm font-medium">{option.label}</span>
      </div>
    );
  };

  const handleDownloadPDF = () => {
    if (!selectedAssessment) return;
    
    // Create a printable version
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bilan - ${selectedAssessment.child?.first_name} ${selectedAssessment.child?.last_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f59e0b; padding-bottom: 20px; }
          .header h1 { color: #f59e0b; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          .child-info { background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .legend { display: flex; gap: 20px; margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 8px; }
          .legend-item { display: flex; align-items: center; gap: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px dashed #ccc; padding: 12px; text-align: left; }
          th { background: #fef3c7; font-weight: bold; }
          .rating { display: inline-block; padding: 5px 10px; border-radius: 20px; }
          .rating-acquis { background: #fef3c7; }
          .rating-en_cours { background: #ffedd5; }
          .rating-a_consolider { background: #dbeafe; }
          .teacher-comment { background: #fef3c7; padding: 20px; border-radius: 8px; margin-top: 20px; }
          .teacher-comment h3 { color: #92400e; margin-top: 0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ANNÉE SCOLAIRE : ${selectedAssessment.school_year}</h1>
          <p>${selectedAssessment.period_name}</p>
        </div>
        
        <div class="child-info">
          <h2 style="margin:0;">Le bilan de ${selectedAssessment.child?.first_name} ${selectedAssessment.child?.last_name}</h2>
          <p style="margin:5px 0;">Mon institutrice est ${selectedAssessment.educator?.first_name} ${selectedAssessment.educator?.last_name}</p>
        </div>

        <h3>Ce que j'ai appris cette période</h3>
        
        <div class="legend">
          <div class="legend-item">☀️ Acquis</div>
          <div class="legend-item">⭐ En cours d'acquisition</div>
          <div class="legend-item">☁️ À consolider</div>
        </div>

        <table>
          <tr>
            <th style="width:30%">Domaines</th>
            <th style="width:20%">Notation</th>
            <th style="width:50%">Commentaires</th>
          </tr>
          ${selectedAssessment.domains.map(d => `
            <tr>
              <td>${d.domain}</td>
              <td>
                <span class="rating rating-${d.rating}">
                  ${d.rating === 'acquis' ? '☀️' : d.rating === 'en_cours' ? '⭐' : '☁️'}
                  ${RATING_OPTIONS.find(r => r.value === d.rating)?.label || d.rating}
                </span>
              </td>
              <td>${d.comment || '-'}</td>
            </tr>
          `).join('')}
        </table>

        ${selectedAssessment.teacher_comment ? `
          <div class="teacher-comment">
            <h3>Petit mot de la maîtresse</h3>
            <p style="font-style:italic;">${selectedAssessment.teacher_comment}</p>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Bilans Périodiques
          </h1>
          <p className="text-muted-foreground">
            Consultez les bulletins d'évaluation de vos enfants
          </p>
        </div>
        
        {children.length > 1 && (
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-[200px]">
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
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : assessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun bilan disponible pour le moment</p>
            <p className="text-sm text-muted-foreground mt-2">
              Les bilans apparaîtront ici après validation par l'administration
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => { setSelectedAssessment(assessment); setShowDetails(true); }}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={assessment.child?.photo_url} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {assessment.child?.first_name?.charAt(0)}
                      {assessment.child?.last_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {assessment.child?.first_name} {assessment.child?.last_name}
                    </CardTitle>
                    <CardDescription>
                      {assessment.period_name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {assessment.school_year}
                  </div>
                  <Button size="sm" variant="ghost">
                    <Eye className="w-4 h-4 mr-1" />
                    Voir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedAssessment?.child?.photo_url} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedAssessment?.child?.first_name?.charAt(0)}
                  {selectedAssessment?.child?.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span>Bilan de {selectedAssessment?.child?.first_name} {selectedAssessment?.child?.last_name}</span>
                <p className="text-sm font-normal text-muted-foreground">
                  {selectedAssessment?.period_name} - {selectedAssessment?.school_year}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Rédigé par {selectedAssessment?.educator?.first_name} {selectedAssessment?.educator?.last_name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] pr-4" ref={printRef}>
            <div className="space-y-6">
              {/* Rating Legend */}
              <div className="flex flex-wrap gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                {RATING_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <option.icon className={`w-5 h-5 ${option.color}`} />
                    <span className="text-sm">{option.label}</span>
                  </div>
                ))}
              </div>

              {/* Domains Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr,auto,2fr] bg-amber-100/50 font-semibold text-sm">
                  <div className="p-3 border-r border-dashed">Domaines</div>
                  <div className="p-3 border-r border-dashed text-center">Notation</div>
                  <div className="p-3">Commentaires</div>
                </div>
                {selectedAssessment?.domains.map((domain, index) => (
                  <div key={index} className="grid grid-cols-[1fr,auto,2fr] border-t border-dashed">
                    <div className="p-3 border-r border-dashed text-sm font-medium">{domain.domain}</div>
                    <div className="p-3 border-r border-dashed flex items-center justify-center">
                      {getRatingDisplay(domain.rating)}
                    </div>
                    <div className="p-3 text-sm">{domain.comment || '-'}</div>
                  </div>
                ))}
              </div>

              {/* Teacher Comment */}
              {selectedAssessment?.teacher_comment && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-amber-800">
                      🚀 Petit mot de la maîtresse
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-amber-900 italic">{selectedAssessment.teacher_comment}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fermer
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger / Imprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParentAssessmentsPage;
