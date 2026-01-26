import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Download, Calendar, Loader2, Mail, Eye, Baby, Pen, Heart, Image as ImageIcon, Video } from "lucide-react";
import html2pdf from 'html2pdf.js';
import logoImage from '@/assets/logo.png';
import { useToast } from '@/hooks/use-toast';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  section?: string;
}

interface WeeklyReport {
  id: string;
  child_id: string;
  week_start_date: string;
  week_end_date: string;
  content?: string;
  activities_learning?: {
    langage_oral_ecrit?: string;
    activites_physiques?: string;
    activites_artistiques?: string;
    outils_mathematiques?: string;
    explorer_monde?: string;
    anglais?: string;
  };
  behavior_attitude?: string[];
  social_relations?: string[];
  emotion_management?: string[];
  meals?: string;
  teacher_observations?: string;
  media_files?: string[];
  validated_at: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

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

export default function ParentWeeklyReportsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchChildren();
    }
  }, [profile]);

  useEffect(() => {
    if (children.length > 0) {
      fetchReports();
    }
  }, [children, selectedChildId]);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from("parent_children")
        .select(`
          child:children(id, first_name, last_name, photo_url, section)
        `)
        .eq("parent_id", profile?.id);

      if (error) throw error;

      const childrenList = (data || [])
        .map(pc => pc.child)
        .filter(Boolean) as Child[];
      
      setChildren(childrenList);
    } catch (error) {
      console.error("Error fetching children:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    let query = supabase
      .from("weekly_reports")
      .select(`
        *,
        profiles!weekly_reports_educator_id_fkey (first_name, last_name)
      `)
      .eq("is_validated", true)
      .order("week_start_date", { ascending: false });

    if (selectedChildId !== "all") {
      query = query.eq("child_id", selectedChildId);
    } else {
      query = query.in("child_id", children.map((c) => c.id));
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des rapports",
        variant: "destructive"
      });
    } else {
      setReports(data as WeeklyReport[]);
    }
  };

  const getChild = (childId: string) => {
    return children.find((c) => c.id === childId);
  };

  const getChildName = (childId: string) => {
    const child = getChild(childId);
    return child ? `${child.first_name} ${child.last_name}` : "";
  };

  const downloadAsPDF = async (report: WeeklyReport) => {
    if (!selectedReport) return;
    
    // Convert logo to base64
    let logoBase64 = '';
    try {
      logoBase64 = await convertImageToBase64(logoImage);
    } catch (error) {
      console.error('Error converting logo to base64:', error);
    }

    const childName = getChildName(report.child_id);
    const educatorName = report.profiles
      ? `${report.profiles.first_name} ${report.profiles.last_name}`
      : "";

    // Build structured content
    let structuredContent = '';
    
    if (report.activities_learning) {
      structuredContent += '<h3 style="font-size: 14px; font-weight: 700; margin-top: 20px; margin-bottom: 10px; color: #92400e;">1. Activités & apprentissages</h3>';
      const domains = [
        { key: 'langage_oral_ecrit', label: 'Développement et structuration du langage oral et écrit' },
        { key: 'activites_physiques', label: 'Agir, s\'exprimer, comprendre à travers les activités physiques' },
        { key: 'activites_artistiques', label: 'Agir, s\'exprimer, comprendre à travers les activités artistiques' },
        { key: 'outils_mathematiques', label: 'L\'acquisition des premiers outils mathématiques' },
        { key: 'explorer_monde', label: 'Explorer le monde' },
        { key: 'anglais', label: 'Anglais' },
      ];
      domains.forEach(domain => {
        const value = report.activities_learning?.[domain.key as keyof typeof report.activities_learning];
        if (value) {
          structuredContent += `<p style="margin: 8px 0;"><strong style="font-size: 11px; color: #666;">${domain.label}:</strong><br/><span style="font-size: 11px;">${value}</span></p>`;
        }
      });
    }

    if (report.behavior_attitude && report.behavior_attitude.length > 0) {
      structuredContent += '<h3 style="font-size: 14px; font-weight: 700; margin-top: 20px; margin-bottom: 10px; color: #92400e;">2. Comportement & attitude</h3>';
      const labels: Record<string, string> = {
        calme: '😌 Calme', joyeux: '😊 Joyeux(se)', souriant: '😄 Souriant(e)',
        participatif: '🙋 Participatif(ve)', reserve: '🤐 Réservé(e)', dynamique: '⚡ Dynamique',
        agite: '😅 Agité(e)', fatigue: '😴 Fatigué(e)', emotif: '😢 Émotif(ve)',
      };
      structuredContent += `<p style="font-size: 11px;">${report.behavior_attitude.map(b => labels[b] || b).join(', ')}</p>`;
    }

    if (report.social_relations && report.social_relations.length > 0) {
      structuredContent += '<h3 style="font-size: 14px; font-weight: 700; margin-top: 20px; margin-bottom: 10px; color: #92400e;">3. Relation aux autres</h3>';
      const labels: Record<string, string> = {
        gentil_camarades: 'Gentil(le) avec les camarades', sociable: 'Sociable',
        cooperatif: 'Coopératif(ve)', mal_partager: 'A parfois du mal à partager',
        jouer_seul: 'Préfère jouer seul(e)',
      };
      structuredContent += `<p style="font-size: 11px;">${report.social_relations.map(r => labels[r] || r).join(', ')}</p>`;
    }

    if (report.emotion_management && report.emotion_management.length > 0) {
      structuredContent += '<h3 style="font-size: 14px; font-weight: 700; margin-top: 20px; margin-bottom: 10px; color: #92400e;">4. Gestion des émotions</h3>';
      const labels: Record<string, string> = {
        peu_pleure: 'A peu pleuré', beaucoup_pleure: 'A beaucoup pleuré',
        besoin_rasseure: 'A eu besoin d\'être rassuré(e)', exprime_mieux: 'S\'exprime mieux émotionnellement',
        en_progres: 'En progrès dans la gestion des émotions', autonome: 'Autonome',
      };
      structuredContent += `<p style="font-size: 11px;">${report.emotion_management.map(e => labels[e] || e).join(', ')}</p>`;
    }

    if (report.meals) {
      structuredContent += '<h3 style="font-size: 14px; font-weight: 700; margin-top: 20px; margin-bottom: 10px; color: #92400e;">5. Repas</h3>';
      const mealsLabels: Record<string, string> = {
        bien_mange: 'Bien mangé', peu_mange: 'Peu mangé', rien_mange: 'Rien mangé',
      };
      structuredContent += `<p style="font-size: 11px;">${mealsLabels[report.meals] || report.meals}</p>`;
    }

    if (report.teacher_observations) {
      structuredContent += '<h3 style="font-size: 14px; font-weight: 700; margin-top: 20px; margin-bottom: 10px; color: #92400e;">6. Observations de l\'enseignante</h3>';
      structuredContent += `<p style="font-size: 11px; white-space: pre-wrap;">${report.teacher_observations}</p>`;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rapport Bi-mensuel - ${childName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&family=Merriweather:ital,wght@0,400;1,400&family=Nunito:wght@400;600;700&display=swap');
          @page { size: A4; margin: 8mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Nunito', 'Merriweather', sans-serif;
            background: #fef6e4;
            color: #333;
            font-size: 11px;
            line-height: 1.5;
            padding: 10mm;
          }
          .page-container {
            background: white;
            padding: 15mm;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 2px dashed #f59e0b;
          }
          .logo-container {
            width: 60px;
            height: 60px;
          }
          .logo-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .header-right {
            text-align: right;
          }
          .title-section {
            text-align: center;
            margin: 20px 0;
          }
          .title-main {
            font-size: 24px;
            font-weight: 700;
            color: #92400e;
            font-family: 'Dancing Script', cursive;
            margin-bottom: 10px;
          }
          .child-name {
            font-size: 18px;
            font-weight: 700;
            color: #b45309;
            margin: 5px 0;
          }
          .period {
            color: #666;
            font-style: italic;
            font-size: 12px;
          }
          .content-section {
            margin: 20px 0;
            line-height: 1.6;
          }
          .signature {
            text-align: right;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e7e5e4;
          }
          .signature .name {
            font-family: 'Dancing Script', cursive;
            font-size: 18px;
            color: #92400e;
          }
          .signature .date {
            font-size: 10px;
            color: #a8a29e;
            margin-top: 5px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #d6d3d1;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header-row">
            <div class="logo-container">
              <img src="${logoBase64}" alt="Logo" />
            </div>
            <div class="header-right">
              <div style="font-weight: 700; font-size: 10px; color: #92400e;">
                Période du ${format(new Date(report.week_start_date), "dd MMMM", { locale: fr })} au ${format(new Date(report.week_end_date), "dd MMMM yyyy", { locale: fr })}
              </div>
            </div>
          </div>
          <div class="title-section">
            <div class="title-main">☀️ Lettre Bi-mensuelle</div>
            <div class="child-name">${childName}</div>
          </div>
          <div class="content-section">
            ${report.content ? `<p style="font-style: italic; margin-bottom: 15px; color: #78716c;">Chers parents,</p><div style="white-space: pre-wrap; text-align: justify; margin: 15px 0; color: #44403c;">${report.content}</div>` : ''}
            ${structuredContent}
          </div>
          <div class="signature">
            <p class="name">${educatorName}</p>
            <p class="date">Le ${format(new Date(report.validated_at || new Date()), "dd MMMM yyyy", { locale: fr })}</p>
          </div>
          <div class="footer">
            <p>Les Petits Rayons de Soleil ☀️</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use html2pdf.js for consistent PDF generation
    try {
      toast({
        title: 'Génération du PDF',
        description: 'Le PDF est en cours de génération...',
      });

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm';
      tempContainer.style.height = '297mm';
      tempContainer.style.overflow = 'hidden';
      document.body.appendChild(tempContainer);
      
      const iframe = document.createElement('iframe');
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      tempContainer.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Could not access iframe document');
      }
      
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
        const checkReady = () => {
          try {
            const body = iframeDoc.body;
            if (!body) {
              setTimeout(checkReady, 100);
              return;
            }
            const images = body.querySelectorAll('img');
            let loaded = 0;
            const total = images.length;
            if (total === 0) {
              clearTimeout(timeout);
              resolve();
              return;
            }
            const handler = () => {
              loaded++;
              if (loaded === total) {
                clearTimeout(timeout);
                resolve();
              }
            };
            images.forEach(img => {
              if (img.complete) loaded++;
              else {
                img.addEventListener('load', handler, { once: true });
                img.addEventListener('error', handler, { once: true });
              }
            });
            if (loaded === total) {
              clearTimeout(timeout);
              resolve();
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        };
        iframe.onload = () => setTimeout(checkReady, 500);
        if (iframeDoc.readyState === 'complete') setTimeout(checkReady, 500);
        else iframeDoc.addEventListener('DOMContentLoaded', checkReady, { once: true });
      });
      
      const bodyElement = iframeDoc.body;
      if (!bodyElement) throw new Error('Could not access body element');
      
      const margin: [number, number, number, number] = [8, 8, 8, 8];
      const filename = `Rapport_${childName.replace(/\s+/g, '_')}_${format(new Date(report.week_start_date), "yyyy-MM-dd", { locale: fr })}.pdf`;
      
      const opt = {
        margin,
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          letterRendering: true,
          windowWidth: 794,
          windowHeight: 1123,
          backgroundColor: '#fef6e4',
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4' as const, 
          orientation: 'portrait' as const,
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt as any).from(bodyElement).save();
      
      try {
        document.body.removeChild(tempContainer);
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }
      
      toast({
        title: 'Succès',
        description: 'Le PDF a été téléchargé avec succès.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      try {
        const containers = document.querySelectorAll('div[style*="-9999px"]');
        containers.forEach(container => {
          if (container.parentNode) container.parentNode.removeChild(container);
        });
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }
      toast({
        title: 'Erreur',
        description: error instanceof Error 
          ? `Impossible de générer le PDF: ${error.message}` 
          : 'Impossible de générer le PDF. Veuillez réessayer.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Mail className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Rapports Bi-mensuelles</h1>
            <p className="text-muted-foreground">Découvrez les aventures de la période de 2 semaines de vos enfants</p>
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

      {reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Aucune lettre disponible</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Les lettres bi-mensuelles apparaîtront ici après validation par l'équipe éducative
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const child = getChild(report.child_id);
            return (
              <Card 
                key={report.id} 
                className="group hover:shadow-lg transition-all cursor-pointer border-amber-100 hover:border-amber-300"
                onClick={() => { setSelectedReport(report); setShowDetails(true); }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-amber-200">
                        <AvatarImage src={child?.photo_url} />
                        <AvatarFallback className="bg-amber-100 text-amber-700">
                          {child?.first_name?.charAt(0)}
                          {child?.last_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{getChildName(report.child_id)}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(report.week_start_date), "dd MMM", { locale: fr })} - {format(new Date(report.week_end_date), "dd MMM", { locale: fr })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Heart className="h-3 w-3 mr-1" />
                      Validé
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-amber-50/50 rounded-lg p-4 mb-4 border border-amber-100">
                    <p className="text-sm text-muted-foreground line-clamp-3 italic">
                      {report.teacher_observations 
                        ? `"${report.teacher_observations.substring(0, 150)}..."`
                        : report.content 
                        ? `"${report.content.substring(0, 150)}..."`
                        : "Rapport bi-mensuel"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                      <Eye className="h-4 w-4 mr-1" />
                      Lire
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader className="pb-4 border-b border-amber-100">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-accent-200">
                <AvatarImage src={getChild(selectedReport?.child_id || "")?.photo_url} />
                <AvatarFallback className="bg-accent-50 text-accent text-lg">
                  {getChild(selectedReport?.child_id || "")?.first_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-primary text-xl">
                  Rapport Bi-Mensuel de {getChildName(selectedReport?.child_id || "")}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  Période du {selectedReport && format(new Date(selectedReport.week_start_date), "dd MMMM", { locale: fr })} au {selectedReport && format(new Date(selectedReport.week_end_date), "dd MMMM yyyy", { locale: fr })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="py-6 space-y-4">
              {/* Legacy content support */}
              {selectedReport?.content && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 rounded-t-xl" />
                  <p className="text-muted-foreground italic mb-4">Chers parents,</p>
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {selectedReport.content}
                  </div>
                </div>
              )}

              {/* New structured data */}
              {selectedReport?.activities_learning && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-amber-800">1. Activités & apprentissages</h4>
                  {selectedReport.activities_learning.langage_oral_ecrit && (
                    <div className="pl-4 border-l-2 border-amber-200">
                      <p className="text-xs font-medium text-muted-foreground">Développement et structuration du langage oral et écrit</p>
                      <p className="text-sm mt-1">{selectedReport.activities_learning.langage_oral_ecrit}</p>
                    </div>
                  )}
                  {selectedReport.activities_learning.activites_physiques && (
                    <div className="pl-4 border-l-2 border-amber-200">
                      <p className="text-xs font-medium text-muted-foreground">Activités physiques</p>
                      <p className="text-sm mt-1">{selectedReport.activities_learning.activites_physiques}</p>
                    </div>
                  )}
                  {selectedReport.activities_learning.activites_artistiques && (
                    <div className="pl-4 border-l-2 border-amber-200">
                      <p className="text-xs font-medium text-muted-foreground">Activités artistiques</p>
                      <p className="text-sm mt-1">{selectedReport.activities_learning.activites_artistiques}</p>
                    </div>
                  )}
                  {selectedReport.activities_learning.outils_mathematiques && (
                    <div className="pl-4 border-l-2 border-amber-200">
                      <p className="text-xs font-medium text-muted-foreground">Outils mathématiques</p>
                      <p className="text-sm mt-1">{selectedReport.activities_learning.outils_mathematiques}</p>
                    </div>
                  )}
                  {selectedReport.activities_learning.explorer_monde && (
                    <div className="pl-4 border-l-2 border-amber-200">
                      <p className="text-xs font-medium text-muted-foreground">Explorer le monde</p>
                      <p className="text-sm mt-1">{selectedReport.activities_learning.explorer_monde}</p>
                    </div>
                  )}
                  {selectedReport.activities_learning.anglais && (
                    <div className="pl-4 border-l-2 border-amber-200">
                      <p className="text-xs font-medium text-muted-foreground">Anglais</p>
                      <p className="text-sm mt-1">{selectedReport.activities_learning.anglais}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedReport?.behavior_attitude && selectedReport.behavior_attitude.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-amber-800">2. Comportement & attitude</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.behavior_attitude.map((behavior) => {
                      const labels: Record<string, string> = {
                        calme: '😌 Calme', joyeux: '😊 Joyeux(se)', souriant: '😄 Souriant(e)',
                        participatif: '🙋 Participatif(ve)', reserve: '🤐 Réservé(e)', dynamique: '⚡ Dynamique',
                        agite: '😅 Agité(e)', fatigue: '😴 Fatigué(e)', emotif: '😢 Émotif(ve)',
                      };
                      return (
                        <Badge key={behavior} variant="secondary" className="text-xs">
                          {labels[behavior] || behavior}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedReport?.social_relations && selectedReport.social_relations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-amber-800">3. Relation aux autres</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.social_relations.map((relation) => {
                      const labels: Record<string, string> = {
                        gentil_camarades: 'Gentil(le) avec les camarades', sociable: 'Sociable',
                        cooperatif: 'Coopératif(ve)', mal_partager: 'A parfois du mal à partager',
                        jouer_seul: 'Préfère jouer seul(e)',
                      };
                      return (
                        <Badge key={relation} variant="outline" className="text-xs">
                          {labels[relation] || relation}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedReport?.emotion_management && selectedReport.emotion_management.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-amber-800">4. Gestion des émotions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.emotion_management.map((emotion) => {
                      const labels: Record<string, string> = {
                        peu_pleure: 'A peu pleuré', beaucoup_pleure: 'A beaucoup pleuré',
                        besoin_rasseure: 'A eu besoin d\'être rassuré(e)', exprime_mieux: 'S\'exprime mieux émotionnellement',
                        en_progres: 'En progrès dans la gestion des émotions', autonome: 'Autonome',
                      };
                      return (
                        <Badge key={emotion} variant="outline" className="text-xs">
                          {labels[emotion] || emotion}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedReport?.meals && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-amber-800">5. Repas</h4>
                  <Badge variant="secondary">
                    {selectedReport.meals === 'bien_mange' ? 'Bien mangé' : 
                     selectedReport.meals === 'peu_mange' ? 'Peu mangé' : 
                     selectedReport.meals === 'rien_mange' ? 'Rien mangé' : selectedReport.meals}
                  </Badge>
                </div>
              )}

              {selectedReport?.teacher_observations && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-amber-800">6. Observations de l'enseignante</h4>
                  <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100 whitespace-pre-wrap text-sm">
                    {selectedReport.teacher_observations}
                  </div>
                </div>
              )}

              {selectedReport?.media_files && selectedReport.media_files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-amber-800">7. Photos de la période</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedReport.media_files.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                        {url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') ? (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        ) : (
                          <img src={url} alt={`Media ${index + 1}`} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-amber-200 text-right">
                <p className="text-amber-800 font-medium">
                  {selectedReport?.profiles?.first_name} {selectedReport?.profiles?.last_name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedReport?.validated_at && format(new Date(selectedReport.validated_at), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
          </ScrollArea>

         <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fermer
            </Button>
             {/*<Button 
              onClick={() => selectedReport && downloadAsPDF(selectedReport)}
              className="bg-amber-600 hover:bg-amber-700"
            >
            <Download className="w-4 h-4 mr-2" />
              Télécharger / Imprimer
            </Button>*/}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
