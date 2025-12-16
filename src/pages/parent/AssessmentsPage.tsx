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
  GraduationCap,
  Sparkles,
  Trophy,
  BookOpen
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
  { value: 'acquis', label: 'Acquis', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-100', border: 'border-amber-200' },
  { value: 'en_cours', label: 'En cours', icon: Star, color: 'text-orange-500', bg: 'bg-orange-100', border: 'border-orange-200' },
  { value: 'a_consolider', label: 'À consolider', icon: Cloud, color: 'text-sky-500', bg: 'bg-sky-100', border: 'border-sky-200' }
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

  const getRatingDisplay = (rating: string, size: 'sm' | 'md' = 'md') => {
    const option = RATING_OPTIONS.find(r => r.value === rating);
    if (!option) return null;
    const Icon = option.icon;
    const sizeClasses = size === 'sm' 
      ? 'px-2 py-0.5 text-xs gap-1' 
      : 'px-3 py-1.5 text-sm gap-2';
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    
    return (
      <div className={`inline-flex items-center rounded-full ${option.bg} ${option.border} border ${sizeClasses}`}>
        <Icon className={`${iconSize} ${option.color}`} />
        <span className="font-medium">{option.label}</span>
      </div>
    );
  };

  const getAcquisCount = (domains: AssessmentDomain[]) => {
    return domains.filter(d => d.rating === 'acquis').length;
  };

  const handleDownloadPDF = () => {
    if (!selectedAssessment) return;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bilan - ${selectedAssessment.child?.first_name} ${selectedAssessment.child?.last_name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');
          body { 
            font-family: 'Nunito', sans-serif; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto;
            background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%);
            min-height: 100vh;
          }
          .paper {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px; 
            border-bottom: 3px dashed #f59e0b;
          }
          .header .year { 
            color: #92400e; 
            font-weight: 700;
            font-size: 14px;
            letter-spacing: 2px;
            margin-bottom: 10px;
          }
          .header h1 { 
            color: #f59e0b; 
            margin: 0;
            font-size: 28px;
          }
          .header .period {
            color: #78716c;
            margin-top: 5px;
          }
          .child-info { 
            background: linear-gradient(135deg, #fef3c7, #fef9e7);
            padding: 20px; 
            border-radius: 12px; 
            margin-bottom: 25px;
            border: 2px solid #fcd34d;
            text-align: center;
          }
          .child-info h2 {
            color: #92400e;
            margin: 0 0 5px 0;
          }
          .child-info p {
            color: #78716c;
            margin: 0;
            font-size: 14px;
          }
          .legend { 
            display: flex; 
            justify-content: center;
            gap: 25px; 
            margin-bottom: 25px; 
            padding: 15px; 
            background: #f5f5f5; 
            border-radius: 10px;
          }
          .legend-item { 
            display: flex; 
            align-items: center; 
            gap: 8px;
            font-size: 14px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px;
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid #e5e7eb;
          }
          th, td { 
            padding: 14px; 
            text-align: left;
            border-bottom: 1px dashed #e5e7eb;
          }
          th { 
            background: linear-gradient(135deg, #fef3c7, #fef9e7);
            font-weight: 700; 
            color: #92400e;
          }
          tr:last-child td { border-bottom: none; }
          .rating { 
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px; 
            border-radius: 20px;
            font-weight: 600;
            font-size: 13px;
          }
          .rating-acquis { background: #fef3c7; color: #92400e; }
          .rating-en_cours { background: #ffedd5; color: #c2410c; }
          .rating-a_consolider { background: #e0f2fe; color: #0369a1; }
          .teacher-comment { 
            background: linear-gradient(135deg, #fef3c7, #fef9e7);
            padding: 25px; 
            border-radius: 12px; 
            margin-top: 25px;
            border: 2px solid #fcd34d;
          }
          .teacher-comment h3 { 
            color: #92400e; 
            margin: 0 0 15px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .teacher-comment p {
            color: #44403c;
            font-style: italic;
            line-height: 1.7;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #a8a29e;
            font-size: 12px;
          }
          @media print { 
            body { padding: 20px; background: white; } 
            .paper { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="paper">
          <div class="header">
            <p class="year">ANNÉE SCOLAIRE ${selectedAssessment.school_year}</p>
            <h1>📋 Bilan Périodique</h1>
            <p class="period">${selectedAssessment.period_name}</p>
          </div>
          
          <div class="child-info">
            <h2>🌟 ${selectedAssessment.child?.first_name} ${selectedAssessment.child?.last_name}</h2>
            <p>Éducatrice: ${selectedAssessment.educator?.first_name} ${selectedAssessment.educator?.last_name}</p>
          </div>

          <div class="legend">
            <div class="legend-item">☀️ <strong>Acquis</strong></div>
            <div class="legend-item">⭐ <strong>En cours</strong></div>
            <div class="legend-item">☁️ <strong>À consolider</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:30%">Domaine</th>
                <th style="width:25%">Évaluation</th>
                <th style="width:45%">Commentaire</th>
              </tr>
            </thead>
            <tbody>
              ${selectedAssessment.domains.map(d => `
                <tr>
                  <td><strong>${d.domain}</strong></td>
                  <td>
                    <span class="rating rating-${d.rating}">
                      ${d.rating === 'acquis' ? '☀️' : d.rating === 'en_cours' ? '⭐' : '☁️'}
                      ${RATING_OPTIONS.find(r => r.value === d.rating)?.label || d.rating}
                    </span>
                  </td>
                  <td>${d.comment || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${selectedAssessment.teacher_comment ? `
            <div class="teacher-comment">
              <h3>💌 Petit mot de la maîtresse</h3>
              <p>${selectedAssessment.teacher_comment}</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Les Petits Rayons de Soleil ☀️</p>
          </div>
        </div>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bilans Périodiques</h1>
            <p className="text-muted-foreground">Suivez les progrès et apprentissages de vos enfants</p>
          </div>
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Aucun bilan disponible</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Les bilans périodiques apparaîtront ici après validation par l'équipe éducative
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => (
            <Card 
              key={assessment.id} 
              className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              onClick={() => { setSelectedAssessment(assessment); setShowDetails(true); }}
            >
              {/* Top colored bar based on performance */}
              <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
              
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={assessment.child?.photo_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {assessment.child?.first_name?.charAt(0)}
                      {assessment.child?.last_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {assessment.child?.first_name} {assessment.child?.last_name}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {assessment.period_name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats summary */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">
                      {getAcquisCount(assessment.domains)}/{assessment.domains.length} acquis
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {assessment.school_year}
                  </Badge>
                </div>

                {/* Preview of ratings */}
                <div className="flex flex-wrap gap-1.5">
                  {assessment.domains.slice(0, 3).map((domain, idx) => (
                    <div key={idx}>
                      {getRatingDisplay(domain.rating, 'sm')}
                    </div>
                  ))}
                  {assessment.domains.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{assessment.domains.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {assessment.educator?.first_name} {assessment.educator?.last_name}
                  </p>
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                    <Eye className="h-4 w-4 mr-1" />
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
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-primary/20">
                <AvatarImage src={selectedAssessment?.child?.photo_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {selectedAssessment?.child?.first_name?.charAt(0)}
                  {selectedAssessment?.child?.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Bilan de {selectedAssessment?.child?.first_name} {selectedAssessment?.child?.last_name}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {selectedAssessment?.period_name} • {selectedAssessment?.school_year}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[55vh] pr-4" ref={printRef}>
            <div className="space-y-6 py-4">
              {/* Educator info */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Rédigé par <span className="font-medium">{selectedAssessment?.educator?.first_name} {selectedAssessment?.educator?.last_name}</span>
                </span>
              </div>

              {/* Rating Legend */}
              <div className="flex flex-wrap gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                {RATING_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <option.icon className={`w-5 h-5 ${option.color}`} />
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                ))}
              </div>

              {/* Domains Table */}
              <div className="border rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr,auto,2fr] bg-gradient-to-r from-amber-50 to-orange-50 font-semibold text-sm">
                  <div className="p-4 border-r border-dashed border-amber-200">Domaine</div>
                  <div className="p-4 border-r border-dashed border-amber-200 text-center min-w-[140px]">Évaluation</div>
                  <div className="p-4">Commentaire</div>
                </div>
                {selectedAssessment?.domains.map((domain, index) => (
                  <div key={index} className="grid grid-cols-[1fr,auto,2fr] border-t border-dashed border-muted">
                    <div className="p-4 border-r border-dashed border-muted text-sm font-medium">
                      {domain.domain}
                    </div>
                    <div className="p-4 border-r border-dashed border-muted flex items-center justify-center min-w-[140px]">
                      {getRatingDisplay(domain.rating)}
                    </div>
                    <div className="p-4 text-sm text-muted-foreground">
                      {domain.comment || '—'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Teacher Comment */}
              {selectedAssessment?.teacher_comment && (
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Petit mot de la maîtresse
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-amber-900 italic leading-relaxed">
                      {selectedAssessment.teacher_comment}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fermer
            </Button>
            <Button onClick={handleDownloadPDF} className="bg-primary hover:bg-primary/90">
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
