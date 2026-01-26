import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Check, X, Loader2, Calendar, Image as ImageIcon, Video, BookOpen, Heart, Users, Smile, UtensilsCrossed, Eye, Camera } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BiMonthlyReportsManagement from "@/components/admin/BiMonthlyReportsManagement";

interface WeeklyReport {
  id: string;
  child_id: string;
  educator_id: string;
  week_start_date: string;
  week_end_date: string;
  content?: string | any;
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
  status: string;
  is_validated: boolean;
  validated_at: string | null;
  validation_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  children?: {
    first_name: string;
    last_name: string;
  };
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface ParsedReportContent {
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
}

export default function WeeklyReportsValidationPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("weekly_reports")
      .select(`
        id,
        child_id,
        educator_id,
        week_start_date,
        week_end_date,
        content,
        activities_learning,
        behavior_attitude,
        social_relations,
        emotion_management,
        meals,
        teacher_observations,
        media_files,
        status,
        is_validated,
        validated_at,
        validation_notes,
        rejection_reason,
        created_at,
        children:child_id (first_name, last_name),
        profiles!weekly_reports_educator_id_fkey (first_name, last_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors du chargement des rapports:", error);
      toast.error("Erreur lors du chargement des rapports");
    } else {
      // Debug: log the first report to see the structure
      if (data && data.length > 0) {
        const firstReport = data[0] as any;
        console.log("Sample report data:", {
          id: firstReport.id,
          activities_learning: firstReport.activities_learning,
          behavior_attitude: firstReport.behavior_attitude,
          meals: firstReport.meals,
          teacher_observations: firstReport.teacher_observations,
          media_files: firstReport.media_files,
          content: firstReport.content,
        });
      }
      setReports(data as unknown as WeeklyReport[]);
    }
    setLoading(false);
  };

  const handleValidate = async (report: WeeklyReport) => {
    setProcessing(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (!profile) {
      toast.error("Profil non trouvé");
      setProcessing(false);
      return;
    }

    const { error } = await supabase
      .from("weekly_reports")
      .update({
        status: "validated",
        is_validated: true,
        validated_by: profile.id,
        validated_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    if (error) {
      toast.error("Erreur lors de la validation");
      console.error(error);
    } else {
      toast.success("Rapport validé et envoyé aux parents");
      fetchReports();
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedReport || !rejectionReason.trim()) {
      toast.error("Veuillez indiquer le motif du rejet");
      return;
    }

    setProcessing(true);
    const { error } = await supabase
      .from("weekly_reports")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason.trim(),
      })
      .eq("id", selectedReport.id);

    if (error) {
      toast.error("Erreur lors du rejet");
      console.error(error);
    } else {
      toast.success("Rapport rejeté");
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedReport(null);
      fetchReports();
    }
    setProcessing(false);
  };

  const pendingReports = reports.filter((r) => r.status === "pending");
  const validatedReports = reports.filter((r) => r.is_validated);
  const rejectedReports = reports.filter((r) => r.status === "rejected");

  const getStatusBadge = (status: string, isValidated: boolean) => {
    if (isValidated) return <Badge className="bg-green-500">Validé</Badge>;
    if (status === "pending") return <Badge className="bg-yellow-500">En attente</Badge>;
    if (status === "rejected") return <Badge className="bg-red-500">Rejeté</Badge>;
    return <Badge variant="secondary">Brouillon</Badge>;
  };

  // Parse content field to extract structured data
  const parseReportContent = (report: WeeklyReport): ParsedReportContent => {
    // Helper to check if a value is meaningful (not null, undefined, empty object, or empty array)
    const hasValue = (val: any): boolean => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'string') return val.trim().length > 0;
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === 'object') return Object.keys(val).length > 0;
      return true;
    };

    // Check if dedicated columns have data
    const hasDedicatedData = 
      hasValue(report.activities_learning) || 
      hasValue(report.behavior_attitude) || 
      hasValue(report.social_relations) ||
      hasValue(report.emotion_management) ||
      hasValue(report.meals) ||
      hasValue(report.teacher_observations) ||
      hasValue(report.media_files);

    if (hasDedicatedData) {
      // Normalize JSONB data - Supabase may return objects or arrays directly
      const normalizeActivities = (val: any) => {
        if (!val || typeof val !== 'object') return undefined;
        if (Array.isArray(val)) return undefined;
        // Check if object has any non-empty string values
        const hasContent = Object.values(val).some((v: any) => {
          if (!v) return false;
          if (typeof v === 'string') return v.trim().length > 0;
          return true;
        });
        return hasContent ? val : undefined;
      };

      const normalizeArray = (val: any) => {
        if (!val) return undefined;
        if (Array.isArray(val)) return val.length > 0 ? val : undefined;
        // If it's a string, try to parse it
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
          } catch {
            return undefined;
          }
        }
        return undefined;
      };

      return {
        activities_learning: normalizeActivities(report.activities_learning),
        behavior_attitude: normalizeArray(report.behavior_attitude),
        social_relations: normalizeArray(report.social_relations),
        emotion_management: normalizeArray(report.emotion_management),
        meals: report.meals && report.meals.trim() ? report.meals : undefined,
        teacher_observations: report.teacher_observations && report.teacher_observations.trim() ? report.teacher_observations : undefined,
        media_files: normalizeArray(report.media_files),
      };
    }

    // Otherwise, parse from content field (legacy support)
    if (!report.content) return {};

    try {
      const content = typeof report.content === 'string' 
        ? JSON.parse(report.content) 
        : report.content;
      
      return {
        activities_learning: content.activities_learning,
        behavior_attitude: content.behavior_attitude,
        social_relations: content.social_relations,
        emotion_management: content.emotion_management,
        meals: content.meals,
        teacher_observations: content.teacher_observations,
        media_files: content.media_files,
      };
    } catch (e) {
      // If content is plain text (legacy), return empty
      return {};
    }
  };

  const ReportCard = ({ report, showActions = false }: { report: WeeklyReport; showActions?: boolean }) => {
    const parsedContent = parseReportContent(report);
    const isLegacyContent = typeof report.content === 'string' && !parsedContent.activities_learning;
    
    // Debug: log parsed content for troubleshooting
    if (report.status === 'pending') {
      console.log('Parsed content for report:', report.id, parsedContent);
    }

    const activityLabels: Record<string, string> = {
      langage_oral_ecrit: 'Développement et structuration du langage oral et écrit',
      activites_physiques: 'Agir, s\'exprimer, comprendre à travers les activités physiques',
      activites_artistiques: 'Agir, s\'exprimer, comprendre à travers les activités artistiques',
      outils_mathematiques: 'L\'acquisition des premiers outils mathématiques',
      explorer_monde: 'Explorer le monde',
      anglais: 'Anglais',
    };

    const behaviorLabels: Record<string, string> = {
      calme: '😌 Calme',
      joyeux: '😊 Joyeux(se)',
      souriant: '😄 Souriant(e)',
      participatif: '🙋 Participatif(ve)',
      reserve: '🤐 Réservé(e)',
      dynamique: '⚡ Dynamique',
      agite: '😅 Agité(e)',
      fatigue: '😴 Fatigué(e)',
      emotif: '😢 Émotif(ve)',
    };

    const socialLabels: Record<string, string> = {
      gentil_camarades: 'Gentil(le) avec les camarades',
      sociable: 'Sociable',
      cooperatif: 'Coopératif(ve)',
      mal_partager: 'A parfois du mal à partager',
      jouer_seul: 'Préfère jouer seul(e)',
    };

    const emotionLabels: Record<string, string> = {
      peu_pleure: 'A peu pleuré',
      beaucoup_pleure: 'A beaucoup pleuré',
      besoin_rasseure: 'A eu besoin d\'être rassuré(e)',
      exprime_mieux: 'S\'exprime mieux émotionnellement',
      en_progres: 'En progrès dans la gestion des émotions',
      autonome: 'Autonome',
    };

    const mealsLabels: Record<string, string> = {
      bien_mange: 'Bien mangé',
      peu_mange: 'Peu mangé',
      rien_mange: 'Rien mangé',
    };

    return (
      <Card className="mb-6 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold">
              {report.children?.first_name} {report.children?.last_name}
            </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <span>Par</span>
                <span className="font-medium">{report.profiles?.first_name} {report.profiles?.last_name}</span>
            </p>
          </div>
            <div className="flex flex-col items-end gap-2">
          {getStatusBadge(report.status, report.is_validated)}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(report.week_start_date), "dd MMM", { locale: fr })} - {format(new Date(report.week_end_date), "dd MMM yyyy", { locale: fr })}
                </span>
              </div>
        </div>
        </div>
      </CardHeader>
        <CardContent className="pt-6">
          <div 
            className="overflow-y-auto overflow-x-hidden pr-4"
            style={{ maxHeight: 'calc(100vh - 350px)' }}
          >
            <div className="space-y-8">
              {/* Debug: Show if no data is found */}
              {!isLegacyContent && !parsedContent.activities_learning && !parsedContent.behavior_attitude && 
               !parsedContent.social_relations && !parsedContent.emotion_management && !parsedContent.meals && 
               !parsedContent.teacher_observations && !parsedContent.media_files && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    ⚠️ Aucune donnée structurée trouvée
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Les données du rapport ne sont pas disponibles. Vérifiez la console pour plus de détails.
                  </p>
                  <details className="mt-3">
                    <summary className="text-xs text-yellow-600 dark:text-yellow-400 cursor-pointer">
                      Données brutes (debug)
                    </summary>
                    <pre className="mt-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded overflow-auto">
                      {JSON.stringify({
                        activities_learning: report.activities_learning,
                        behavior_attitude: report.behavior_attitude,
                        social_relations: report.social_relations,
                        emotion_management: report.emotion_management,
                        meals: report.meals,
                        teacher_observations: report.teacher_observations,
                        media_files: report.media_files,
                        content: report.content,
                      }, null, 2)}
                    </pre>
                  </details>
                </div>
              )}

              {/* Legacy content support (plain text) */}
              {isLegacyContent && (
                <div className="bg-muted/30 rounded-xl p-6 border-2 border-dashed border-muted-foreground/20">
                  <p className="text-sm text-muted-foreground italic">Contenu legacy (format texte)</p>
                  <div className="mt-3 bg-background rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed">
          {report.content}
        </div>
                </div>
              )}

              {/* 1. Activités & apprentissages */}
              {parsedContent.activities_learning && Object.values(parsedContent.activities_learning).some(v => v && v.trim()) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/20">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h4 className="font-bold text-lg text-foreground">1. Activités & Apprentissages</h4>
                  </div>
                  <div className="grid gap-4">
                    {Object.entries(parsedContent.activities_learning).map(([key, value]) => {
                      if (!value || !value.trim()) return null;
                      return (
                        <div key={key} className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            {activityLabels[key as keyof typeof activityLabels] || key}
                          </p>
                          <p className="text-sm leading-relaxed text-foreground pl-4">{value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Comportement & attitude */}
              {parsedContent.behavior_attitude && parsedContent.behavior_attitude.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/20">
                    <Smile className="h-5 w-5 text-primary" />
                    <h4 className="font-bold text-lg text-foreground">2. Comportement & Attitude en classe</h4>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {parsedContent.behavior_attitude.map((behavior) => (
                      <Badge 
                        key={behavior} 
                        variant="secondary" 
                        className="text-sm py-2 px-4 bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        {behaviorLabels[behavior] || behavior}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Relation aux autres */}
              {parsedContent.social_relations && parsedContent.social_relations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                    <h4 className="font-bold text-lg text-foreground">3. Relation aux Autres</h4>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {parsedContent.social_relations.map((relation) => (
                      <Badge 
                        key={relation} 
                        variant="outline" 
                        className="text-sm py-2 px-4 bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100 border-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/40 transition-colors"
                      >
                        {socialLabels[relation] || relation}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Gestion des émotions */}
              {parsedContent.emotion_management && parsedContent.emotion_management.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/20">
                    <Heart className="h-5 w-5 text-primary" />
                    <h4 className="font-bold text-lg text-foreground">4. Gestion des Émotions</h4>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {parsedContent.emotion_management.map((emotion) => (
                      <Badge 
                        key={emotion} 
                        variant="outline" 
                        className="text-sm py-2 px-4 bg-pink-50 dark:bg-pink-950/20 text-pink-900 dark:text-pink-100 border-pink-300 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-950/40 transition-colors"
                      >
                        {emotionLabels[emotion] || emotion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Repas */}
              {parsedContent.meals && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/20">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                    <h4 className="font-bold text-lg text-foreground">5. Repas</h4>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="text-sm py-2 px-5 bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 border border-orange-200 dark:border-orange-800"
                  >
                    {mealsLabels[parsedContent.meals] || parsedContent.meals}
                  </Badge>
                </div>
              )}

              {/* 6. Observations de l'enseignante */}
              {parsedContent.teacher_observations && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/20">
                    <Eye className="h-5 w-5 text-primary" />
                    <h4 className="font-bold text-lg text-foreground">6. Observations de l'Enseignante</h4>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-6 shadow-sm">
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {parsedContent.teacher_observations}
                    </p>
                  </div>
                </div>
              )}

              {/* 7. Photos de la semaine */}
              {parsedContent.media_files && parsedContent.media_files.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/20">
                    <Camera className="h-5 w-5 text-primary" />
                    <h4 className="font-bold text-lg text-foreground">7. Photos de la Période</h4>
                    <Badge variant="secondary" className="ml-auto">
                      {parsedContent.media_files.length} {parsedContent.media_files.length > 1 ? 'médias' : 'média'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {parsedContent.media_files.map((url, index) => (
                      <div 
                        key={index} 
                        className="relative aspect-square rounded-xl overflow-hidden border-2 border-muted group cursor-pointer hover:border-primary/50 transition-all shadow-md hover:shadow-lg"
                      >
                        {url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('video') ? (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                            <div className="text-center">
                              <Video className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">Vidéo</p>
                            </div>
                          </div>
                        ) : (
                          <img 
                            src={url} 
                            alt={`Photo ${index + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t-2 border-muted">
            <div className="flex items-center justify-between">
              <p className="text-sm italic text-muted-foreground">
                <span className="font-medium">Signé par:</span> {report.profiles?.first_name} {report.profiles?.last_name}
              </p>
              {report.created_at && (
                <p className="text-xs text-muted-foreground">
                  Créé le {format(new Date(report.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                </p>
              )}
            </div>
        {report.rejection_reason && (
              <div className="bg-destructive/10 border-2 border-destructive/20 text-destructive rounded-xl p-4 mt-4">
                <p className="text-sm font-semibold mb-1">⚠️ Motif du rejet:</p>
                <p className="text-sm">{report.rejection_reason}</p>
              </div>
            )}
          </div>
        {showActions && (
            <div className="flex gap-3 justify-end mt-6 pt-6 border-t-2 border-muted">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReport(report);
                setRejectDialogOpen(true);
              }}
              disabled={processing}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
              <Button 
                onClick={() => handleValidate(report)} 
                disabled={processing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Valider
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Rapports Bi-mensuels</h1>
          <p className="text-muted-foreground">
            Remplissez et validez les rapports bi-mensuels des enfants
          </p>
        </div>
      </div>

      {/* Bloc de création / édition par l'administration */}
      <BiMonthlyReportsManagement />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            En attente ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="validated">
            Validés ({validatedReports.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejetés ({rejectedReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingReports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun rapport en attente de validation
              </CardContent>
            </Card>
          ) : (
            pendingReports.map((report) => (
              <ReportCard key={report.id} report={report} showActions />
            ))
          )}
        </TabsContent>

        <TabsContent value="validated" className="mt-4">
          {validatedReports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun rapport validé
              </CardContent>
            </Card>
          ) : (
            validatedReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {rejectedReports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun rapport rejeté
              </CardContent>
            </Card>
          ) : (
            rejectedReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de rejet */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le rapport</DialogTitle>
            <DialogDescription>
              Veuillez indiquer le motif du rejet. L'éducateur pourra modifier et resoumettre le rapport.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Motif du rejet..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
