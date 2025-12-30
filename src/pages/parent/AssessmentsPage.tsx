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
import logoImage from '@/assets/logo.png';

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

const getSectionAbbreviation = (section?: string): string => {
  if (!section) return '';
  const abbreviations: Record<string, string> = {
    'maternelle_PS1': 'PS',
    'maternelle_PS2': 'PS',
    'maternelle_MS': 'MS',
    'maternelle_GS': 'GS',
    'creche_etoile': 'Crèche',
    'creche_nuage': 'Crèche',
    'creche_soleil': 'TPS',
    'garderie': 'Garderie'
  };
  return abbreviations[section] || '';
};

const convertImageToBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

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

  const handleDownloadPDF = async () => {
    if (!selectedAssessment) return;
    
    // Convert logo to base64
    let logoBase64 = '';
    try {
      logoBase64 = await convertImageToBase64(logoImage);
    } catch (error) {
      console.error('Error converting logo to base64:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le logo',
        variant: 'destructive'
      });
    }

    const sectionAbbr = getSectionAbbreviation(selectedAssessment.child?.section);
    
    // Convert period number to Roman numeral
    const getPeriodRoman = (periodName: string): string => {
      const match = periodName.match(/\d+/);
      if (!match) return 'I';
      const num = parseInt(match[0]);
      const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V'];
      return romanNumerals[num] || num.toString();
    };
    
    const periodRoman = getPeriodRoman(selectedAssessment.period_name);
    
    // Calculate font size based on number of domains for single page fit
    const domainCount = selectedAssessment.domains.length;
    const baseFontSize = domainCount > 6 ? 9 : domainCount > 4 ? 10 : 11;
    const rowPadding = domainCount > 6 ? 4 : domainCount > 4 ? 6 : 8;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bilan - ${selectedAssessment.child?.first_name} ${selectedAssessment.child?.last_name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Nunito:wght@400;600;700&display=swap');
          @page {
            size: A4;
            margin: 8mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body { 
            font-family: 'Nunito', 'Comic Neue', sans-serif;
            background: #fef6e4;
            color: #333;
            font-size: ${baseFontSize}px;
            line-height: 1.3;
          }
          .page-container {
            width: 100%;
            min-height: 100vh;
            padding: 10px 15px;
            background: #fef6e4;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
          }
          .logo-container {
            width: 70px;
            height: 70px;
          }
          .logo-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .header-right {
            text-align: right;
          }
          .year-text {
            font-weight: 700;
            font-size: 12px;
            color: #92400e;
            letter-spacing: 0.5px;
          }
          .clouds-decoration {
            display: flex;
            justify-content: center;
            gap: 4px;
            margin-top: 4px;
          }
          .cloud {
            background: linear-gradient(135deg, #93c5fd, #60a5fa);
            border-radius: 10px;
            height: 12px;
            width: 20px;
          }
          .title-section {
            text-align: center;
            margin: 6px 0;
          }
          .title-main {
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
          }
          .child-name {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .dashed-line {
            display: flex;
            justify-content: center;
            margin: 4px 0;
          }
          .dashed-line span {
            width: 80px;
            height: 0;
            border-bottom: 2px dashed #f59e0b;
          }
          .teacher-section {
            text-align: center;
            margin: 8px 0;
          }
          .teacher-label {
            font-size: 11px;
            color: #666;
          }
          .teacher-name {
            font-size: 14px;
            font-weight: 700;
            color: #333;
            border-bottom: 2px dashed #f59e0b;
            padding-bottom: 2px;
            display: inline-block;
          }
          .sun-decoration {
            display: inline-block;
            margin-left: 8px;
            font-size: 24px;
          }
          .section-banner {
            background: linear-gradient(135deg, #fcd34d, #f59e0b);
            color: #fff;
            padding: 6px 20px;
            border-radius: 20px;
            margin: 10px auto;
            width: fit-content;
            font-weight: 700;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
          }
          .clip-icon {
            font-size: 14px;
          }
          .legend-row {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 10px 0;
            flex-wrap: wrap;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 10px;
            color: #555;
          }
          .legend-icon {
            font-size: 18px;
          }
          .table-container {
            margin: 8px 0;
            border: 2px dashed #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          table { 
            width: 100%; 
            border-collapse: collapse;
          }
          thead {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
          }
          th { 
            padding: ${rowPadding}px 10px;
            font-weight: 700; 
            color: #92400e;
            font-size: 12px;
            text-align: left;
            border-bottom: 2px dashed #fcd34d;
          }
          th.rating-col,
          td.rating-col {
            text-align: center;
            width: 80px;
          }
          td { 
            padding: ${rowPadding}px 10px;
            font-size: ${baseFontSize}px;
            color: #333;
            border-bottom: 1px dashed #e5e7eb;
            vertical-align: middle;
          }
          tr:last-child td {
            border-bottom: none;
          }
          .domain-name {
            font-weight: 500;
            width: 28%;
          }
          .comment-text {
            color: #555;
            text-align: justify;
            line-height: 1.35;
          }
          .rating-icon {
            font-size: 22px;
          }
          .teacher-comment-section {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border: 2px dashed #fcd34d;
            border-radius: 12px;
            padding: 10px 15px;
            margin-top: 10px;
            text-align: center;
          }
          .teacher-comment-title {
            font-weight: 700;
            font-size: 13px;
            color: #92400e;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .rocket-icon {
            font-size: 16px;
          }
          .teacher-comment-text {
            color: #444;
            font-style: italic;
            line-height: 1.4;
            font-size: ${baseFontSize}px;
          }
          .clap-icon {
            margin-left: 4px;
            font-size: 14px;
          }
          @media print { 
            body { 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .page-container {
              padding: 5mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- Header with logo and year -->
          <div class="header-row">
            <div class="logo-container">
              <img src="${logoBase64}" alt="Logo" />
            </div>
            <div class="header-right">
              <div class="year-text">ANNÉE SCOLAIRE : ${selectedAssessment.school_year}</div>
              <div class="clouds-decoration">
                <div class="cloud"></div>
                <div class="cloud" style="width: 15px; height: 10px;"></div>
                <div class="cloud" style="width: 12px; height: 8px;"></div>
              </div>
            </div>
          </div>

          <!-- Title -->
          <div class="title-section">
            <div class="title-main">Le bilan de ma Période ${periodRoman}${sectionAbbr ? ` en ${sectionAbbr}` : ''}</div>
            <div class="child-name">${selectedAssessment.child?.last_name?.toUpperCase()} ${selectedAssessment.child?.first_name}</div>
            <div class="dashed-line"><span></span></div>
          </div>

          <!-- Teacher section -->
          <div class="teacher-section">
            <div class="teacher-label">Mon institutrice est</div>
            <div>
              <span class="teacher-name">Maîtresse ${selectedAssessment.educator?.last_name}</span>
              <span class="sun-decoration">☀️</span>
            </div>
          </div>

          <!-- Section banner -->
          <div class="section-banner">
            <span class="clip-icon">📎</span>
            <span>Ce que j'ai appris cette période</span>
          </div>

          <!-- Legend -->
          <div class="legend-row">
            <div class="legend-item">
              <span class="legend-icon">☀️</span>
              <span><strong>Acquis</strong></span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">⭐</span>
              <span><strong>En cours d'acquisition</strong></span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">☁️</span>
              <span><strong>A consolider</strong></span>
            </div>
          </div>

          <!-- Assessment table -->
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th class="domain-name">Domaines</th>
                  <th class="rating-col">Notation</th>
                  <th>Commentaires</th>
                </tr>
              </thead>
              <tbody>
                ${selectedAssessment.domains.map(d => {
                  const ratingIcon = d.rating === 'acquis' ? '☀️' : d.rating === 'en_cours' ? '⭐' : '☁️';
                  return `
                  <tr>
                    <td class="domain-name">${d.domain}</td>
                    <td class="rating-col">
                      <span class="rating-icon">${ratingIcon}</span>
                    </td>
                    <td class="comment-text">${d.comment || '—'}</td>
                  </tr>
                `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Teacher comment -->
          ${selectedAssessment.teacher_comment ? `
            <div class="teacher-comment-section">
              <div class="teacher-comment-title">
                <span>Petit mot de la maîtresse</span>
                <span class="rocket-icon">🚀</span>
              </div>
              <div class="teacher-comment-text">
                ${selectedAssessment.teacher_comment} <span class="clap-icon">👏</span>
              </div>
            </div>
          ` : ''}
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
