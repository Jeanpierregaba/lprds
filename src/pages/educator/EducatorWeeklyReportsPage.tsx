import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Save, Send, Calendar, Loader2, Upload, X, Video, Trash2, FilePlus, Clock, CheckCircle, XCircle, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import DraftWeeklyReportsList from "@/components/educator/DraftWeeklyReportsList";
import { WeeklyReportsList } from "@/components/educator/WeeklyReportsList";

interface Child {
  id: string;
  first_name: string;
  last_name: string;
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
  status: string;
  is_validated: boolean;
  rejection_reason: string | null;
  created_at: string;
  children?: Child;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

export default function EducatorWeeklyReportsPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [educatorProfile, setEducatorProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingReport, setExistingReport] = useState<WeeklyReport | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('new');
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [refreshDrafts, setRefreshDrafts] = useState(0);
  const [refreshPending, setRefreshPending] = useState(0);
  const [refreshValidated, setRefreshValidated] = useState(0);
  const [refreshRejected, setRefreshRejected] = useState(0);
  
  // Form state
  const [activitiesLearning, setActivitiesLearning] = useState({
    langage_oral_ecrit: "",
    activites_physiques: "",
    activites_artistiques: "",
    outils_mathematiques: "",
    explorer_monde: "",
    anglais: ""
  });
  const [behaviorAttitude, setBehaviorAttitude] = useState<string[]>([]);
  const [socialRelations, setSocialRelations] = useState<string[]>([]);
  const [emotionManagement, setEmotionManagement] = useState<string[]>([]);
  const [meals, setMeals] = useState<string>("");
  const [teacherObservations, setTeacherObservations] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchEducatorProfile();
      fetchChildren();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChildId && selectedWeek && activeTab === 'new') {
      checkExistingReport();
    }
  }, [selectedChildId, selectedWeek, activeTab]);

  // Load draft data when editing
  useEffect(() => {
    if (selectedDraft) {
      setSelectedChildId(selectedDraft.child_id);
      setSelectedWeek(new Date(selectedDraft.week_start_date));
      // Load form data from draft
      const draftData = selectedDraft as any;
      const structured =
        draftData.activities_learning ||
        draftData.content?.activities_learning ||
        {};
      setActivitiesLearning({
        langage_oral_ecrit: structured.langage_oral_ecrit || "",
        activites_physiques: structured.activites_physiques || "",
        activites_artistiques: structured.activites_artistiques || "",
        outils_mathematiques: structured.outils_mathematiques || "",
        explorer_monde: structured.explorer_monde || "",
        anglais: structured.anglais || "",
      });
      const behavior =
        draftData.behavior_attitude ||
        draftData.content?.behavior_attitude ||
        [];
      setBehaviorAttitude(behavior);
      const social =
        draftData.social_relations ||
        draftData.content?.social_relations ||
        [];
      setSocialRelations(social);
      const emotions =
        draftData.emotion_management ||
        draftData.content?.emotion_management ||
        [];
      setEmotionManagement(emotions);
      const mealsValue =
        draftData.meals ||
        draftData.content?.meals ||
        "";
      setMeals(mealsValue);
      const teacherObs =
        draftData.teacher_observations ||
        draftData.content?.teacher_observations ||
        "";
      setTeacherObservations(teacherObs);
      const media =
        draftData.media_files ||
        draftData.content?.media_files ||
        [];
      setMediaUrls(media);
      setExistingReport(selectedDraft);
    }
  }, [selectedDraft]);

  const fetchEducatorProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("user_id", user?.id)
      .single();
    
    if (data) setEducatorProfile(data);
  };

  const fetchChildren = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (profile) {
      const { data: groups, error: groupsError } = await supabase
        .from("groups")
        .select("id")
        .eq("assigned_educator_id", profile.id);

      if (groupsError) {
        console.error("Error fetching educator groups:", groupsError);
      }

      const groupIds = (groups || []).map((g) => g.id).filter(Boolean);

      const orFilters = [`assigned_educator_id.eq.${profile.id}`];
      if (groupIds.length > 0) {
        orFilters.push(`group_id.in.(${groupIds.join(",")})`);
      }

      // Children directly assigned to this educator
      const { data: directChildren } = await supabase
        .from("children")
        .select("id")
        .eq("assigned_educator_id", profile.id)
        .eq("status", "active");
      const linkIds = (directChildren || []).map((c: any) => c.id);

      const { data } = await supabase
        .from("children")
        .select("id, first_name, last_name")
        .eq("status", "active")
        .or(orFilters.join(","))
        .order("first_name");
      
      let allChildren = data || [];
      if (linkIds.length > 0) {
        const { data: extra, error: extraError } = await supabase
          .from("children")
          .select("id, first_name, last_name")
          .eq("status", "active")
          .in("id", linkIds);
        if (extraError) {
          console.error("Error fetching linked children:", extraError);
        } else {
          allChildren = [...allChildren, ...(extra || [])];
        }
      }

      // dedupe
      const unique = allChildren.filter((c, i, self) => i === self.findIndex(cc => cc.id === c.id));
      setChildren(unique);
    }
    setLoading(false);
  };

  const handleEditDraft = useCallback((draft: any) => {
    setSelectedDraft(draft);
    setActiveTab('new');
  }, []);

  const handleReportSaved = useCallback(() => {
    setSelectedDraft(null);
    setExistingReport(null);
    setRefreshDrafts(prev => prev + 1);
    setRefreshPending(prev => prev + 1);
    // Reset form
    setActivitiesLearning({
      langage_oral_ecrit: "",
      activites_physiques: "",
      activites_artistiques: "",
      outils_mathematiques: "",
      explorer_monde: "",
      anglais: ""
    });
    setBehaviorAttitude([]);
    setSocialRelations([]);
    setEmotionManagement([]);
    setMeals("");
    setTeacherObservations("");
    setMediaUrls([]);
    setMediaFiles([]);
  }, []);

  const handleViewReport = useCallback((report: any) => {
    // TODO: Implémenter la vue détaillée du rapport
    console.log('View report:', report);
  }, []);

  const handleEditReport = useCallback((report: any) => {
    setSelectedDraft(report);
    setActiveTab('new');
  }, []);

  const checkExistingReport = async () => {
    const periodStart = format(selectedWeek, "yyyy-MM-dd");
    
    const { data } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("child_id", selectedChildId)
      .eq("week_start_date", periodStart)
      .maybeSingle();
    
    if (data) {
      setExistingReport(data as WeeklyReport);
      // Load form data from existing report
      const reportData = data as any;
      const structured =
        reportData.activities_learning ||
        reportData.content?.activities_learning ||
        {};
      setActivitiesLearning({
        langage_oral_ecrit: structured.langage_oral_ecrit || "",
        activites_physiques: structured.activites_physiques || "",
        activites_artistiques: structured.activites_artistiques || "",
        outils_mathematiques: structured.outils_mathematiques || "",
        explorer_monde: structured.explorer_monde || "",
        anglais: structured.anglais || "",
      });
      const behavior =
        reportData.behavior_attitude ||
        reportData.content?.behavior_attitude ||
        [];
      setBehaviorAttitude(behavior);
      const social =
        reportData.social_relations ||
        reportData.content?.social_relations ||
        [];
      setSocialRelations(social);
      const emotions =
        reportData.emotion_management ||
        reportData.content?.emotion_management ||
        [];
      setEmotionManagement(emotions);
      const mealsValue =
        reportData.meals ||
        reportData.content?.meals ||
        "";
      setMeals(mealsValue);
      const teacherObs =
        reportData.teacher_observations ||
        reportData.content?.teacher_observations ||
        "";
      setTeacherObservations(teacherObs);
      const media =
        reportData.media_files ||
        reportData.content?.media_files ||
        [];
      setMediaUrls(media);
    } else {
      setExistingReport(null);
      // Reset form
      setActivitiesLearning({
        langage_oral_ecrit: "",
        activites_physiques: "",
        activites_artistiques: "",
        outils_mathematiques: "",
        explorer_monde: "",
        anglais: ""
      });
      setBehaviorAttitude([]);
      setSocialRelations([]);
      setEmotionManagement([]);
      setMeals("");
      setTeacherObservations("");
      setMediaUrls([]);
      setMediaFiles([]);
    }
  };

  const handleMediaUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = 50 * 1024 * 1024; // 50MB
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name} n'est pas une image ou une vidéo valide`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} est trop volumineux (max 50MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setMediaFiles(prev => [...prev, ...validFiles]);
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeMediaUrl = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMediaFiles = async (reportId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of mediaFiles) {
      try {
        setUploadingMedia(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `weekly-reports/${reportId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const fileType = file.type.startsWith('video/') ? 'vidéo' : 'photo';

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('daily-reports')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`Erreur upload ${fileType}:`, uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('daily-reports')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      } catch (error: any) {
        console.error('Erreur upload média:', error);
        toast.error(`Impossible d'uploader ${file.name}`);
      }
    }

    setUploadingMedia(false);
    return uploadedUrls;
  };

  const handleSave = async (submit: boolean = false) => {
    if (!selectedChildId) {
      toast.error("Veuillez sélectionner un enfant");
      return;
    }

    if (!educatorProfile) {
      toast.error("Profil éducateur non trouvé");
      return;
    }

    setSaving(true);
    const periodStart = format(selectedWeek, "yyyy-MM-dd");
    // Période bi-mensuelle : 2 semaines = 13 jours après le début (du lundi au dimanche suivant)
    const periodEnd = format(addDays(selectedWeek, 13), "yyyy-MM-dd");

    const reportData: any = {
      child_id: selectedChildId,
      educator_id: educatorProfile.id,
      week_start_date: periodStart,
      week_end_date: periodEnd,
      // Sauvegarder dans les colonnes dédiées pour faciliter le traitement et l'affichage
      activities_learning: activitiesLearning,
      behavior_attitude: behaviorAttitude,
      social_relations: socialRelations,
      emotion_management: emotionManagement,
      meals: meals,
      teacher_observations: teacherObservations.trim(),
      media_files: mediaUrls,
      status: submit ? "pending" : "draft",
    };

    let error;
    let reportId = existingReport?.id;
    
    // First, create or update the report to get an ID
    if (existingReport) {
      const { error: updateError } = await supabase
        .from("weekly_reports")
        .update(reportData)
        .eq("id", existingReport.id);
      error = updateError;
      reportId = existingReport.id;
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from("weekly_reports")
        .insert(reportData)
        .select()
        .single();
      error = insertError;
      if (insertData) reportId = insertData.id;
    }

    // Upload media files si on a un report ID
    if (!error && reportId && mediaFiles.length > 0) {
      const uploadedUrls = await uploadMediaFiles(reportId);
      if (uploadedUrls.length > 0) {
        const updatedMediaUrls = [...mediaUrls, ...uploadedUrls];

        // Mettre à jour la colonne dédiée media_files
        await supabase
          .from("weekly_reports")
          .update({
            media_files: updatedMediaUrls,
          } as any)
          .eq("id", reportId);
        setMediaUrls(updatedMediaUrls);
        setMediaFiles([]);
      }
    }

    setSaving(false);

    if (error) {
      console.error("Erreur lors de l'enregistrement du rapport bi-mensuel:", {
        error,
        reportData,
        existingReport,
      });
      // Afficher le détail de l'erreur Supabase si disponible
      const message =
        (error as any)?.message ||
        (error as any)?.hint ||
        "Erreur lors de l'enregistrement";
      toast.error(message);
    } else {
      toast.success(submit ? "Rapport soumis pour validation" : "Brouillon enregistré");
      handleReportSaved();
      if (submit) {
        setActiveTab('pending');
      }
    }
  };

  const getBiMonthlyOptions = () => {
    const periods = [];
    const today = new Date();
    for (let i = 0; i < 8; i++) {
      // Chaque période bi-mensuelle commence un lundi et dure 2 semaines (14 jours)
      const periodStart = startOfWeek(addDays(today, -i * 14), { weekStartsOn: 1 });
      periods.push(periodStart);
    }
    return periods;
  };

  const getStatusBadge = (status: string, isValidated: boolean) => {
    if (isValidated) return <Badge className="bg-green-500">Validé</Badge>;
    if (status === "pending") return <Badge className="bg-yellow-500">En attente</Badge>;
    if (status === "rejected") return <Badge className="bg-red-500">Rejeté</Badge>;
    return <Badge variant="secondary">Brouillon</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rapports Bi-mensuels</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Créez et gérez les rapports bi-mensuels pour les enfants de votre groupe
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <TabsTrigger value="new" className="flex items-center gap-1 sm:gap-2">
            <FilePlus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Nouveau</span>
            <span className="sm:hidden">Nouveau</span>
          </TabsTrigger>
          
          <TabsTrigger value="drafts" className="flex items-center gap-1 sm:gap-2">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Brouillons</span>
            <span className="sm:hidden">Brouillons</span>
          </TabsTrigger>
          
          <TabsTrigger value="pending" className="flex items-center gap-1 sm:gap-2">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">En attente</span>
            <span className="sm:hidden">Attente</span>
          </TabsTrigger>
          
          <TabsTrigger value="rejected" className="flex items-center gap-1 sm:gap-2">
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Rejetés</span>
            <span className="sm:hidden">Rejetés</span>
          </TabsTrigger>
          
          <TabsTrigger value="validated" className="flex items-center gap-1 sm:gap-2">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Historique</span>
            <span className="sm:hidden">Validés</span>
          </TabsTrigger>
        </TabsList>

        {/* Nouveau Rapport */}
        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FilePlus className="h-5 w-5" />
                {selectedDraft ? 'Continuer le rapport' : 'Créer un rapport bi-mensuel'}
              </CardTitle>
              <CardDescription>
                {selectedDraft 
                  ? 'Complétez et envoyez votre rapport sauvegardé'
                  : 'Sélectionnez un enfant de votre groupe et remplissez le formulaire de suivi pour la période de 2 semaines'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Enfant</Label>
                <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un enfant" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.first_name} {child.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Période (2 semaines)</Label>
                <Select 
                  value={selectedWeek.toISOString()} 
                  onValueChange={(val) => setSelectedWeek(new Date(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getBiMonthlyOptions().map((period) => (
                      <SelectItem key={period.toISOString()} value={period.toISOString()}>
                        {format(period, "dd MMM", { locale: fr })} - {format(addDays(period, 13), "dd MMM yyyy", { locale: fr })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {existingReport && (
              <div className="flex items-center gap-2">
                {getStatusBadge(existingReport.status, existingReport.is_validated || false)}
                {existingReport.rejection_reason && (
                  <span className="text-sm text-destructive">
                    Motif: {existingReport.rejection_reason}
                  </span>
                )}
              </div>
            )}

            {!existingReport?.is_validated && (
              <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden pr-4 border rounded-md p-4">
                <div className="space-y-6">
                  {/* 1. Activités & apprentissages */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">1. Activités & apprentissages</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Développement et structuration du langage oral et écrit</Label>
                        <Textarea
                          value={activitiesLearning.langage_oral_ecrit}
                          onChange={(e) => setActivitiesLearning(prev => ({ ...prev, langage_oral_ecrit: e.target.value }))}
                          placeholder="Commentaires..."
                          className="min-h-[80px] resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Agir, s'exprimer, comprendre à travers les activités physiques</Label>
                        <Textarea
                          value={activitiesLearning.activites_physiques}
                          onChange={(e) => setActivitiesLearning(prev => ({ ...prev, activites_physiques: e.target.value }))}
                          placeholder="Commentaires..."
                          className="min-h-[80px] resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Agir, s'exprimer, comprendre à travers les activités artistiques</Label>
                        <Textarea
                          value={activitiesLearning.activites_artistiques}
                          onChange={(e) => setActivitiesLearning(prev => ({ ...prev, activites_artistiques: e.target.value }))}
                          placeholder="Commentaires..."
                          className="min-h-[80px] resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>L'acquisition des premiers outils mathématiques</Label>
                        <Textarea
                          value={activitiesLearning.outils_mathematiques}
                          onChange={(e) => setActivitiesLearning(prev => ({ ...prev, outils_mathematiques: e.target.value }))}
                          placeholder="Commentaires..."
                          className="min-h-[80px] resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Explorer le monde</Label>
                        <Textarea
                          value={activitiesLearning.explorer_monde}
                          onChange={(e) => setActivitiesLearning(prev => ({ ...prev, explorer_monde: e.target.value }))}
                          placeholder="Commentaires..."
                          className="min-h-[80px] resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Anglais</Label>
                        <Textarea
                          value={activitiesLearning.anglais}
                          onChange={(e) => setActivitiesLearning(prev => ({ ...prev, anglais: e.target.value }))}
                          placeholder="Commentaires..."
                          className="min-h-[80px] resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4" />

                  {/* 2. Comportement & attitude */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">2. Comportement & attitude en classe</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { value: 'calme', emoji: '😌', label: 'Calme' },
                        { value: 'joyeux', emoji: '😊', label: 'Joyeux(se)' },
                        { value: 'souriant', emoji: '😄', label: 'Souriant(e)' },
                        { value: 'participatif', emoji: '🙋', label: 'Participatif(ve)' },
                        { value: 'reserve', emoji: '🤐', label: 'Réservé(e)' },
                        { value: 'dynamique', emoji: '⚡', label: 'Dynamique' },
                        { value: 'agite', emoji: '😅', label: 'Agité(e)' },
                        { value: 'fatigue', emoji: '😴', label: 'Fatigué(e)' },
                        { value: 'emotif', emoji: '😢', label: 'Émotif(ve)' },
                      ].map((item) => (
                        <div key={item.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`behavior-${item.value}`}
                            checked={behaviorAttitude.includes(item.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setBehaviorAttitude(prev => [...prev, item.value]);
                              } else {
                                setBehaviorAttitude(prev => prev.filter(v => v !== item.value));
                              }
                            }}
                          />
                          <Label htmlFor={`behavior-${item.value}`} className="text-sm font-normal cursor-pointer flex items-center gap-1">
                            <span>{item.emoji}</span>
                            <span>{item.label}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4" />

                  {/* 3. Relation aux autres */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">3. Relation aux autres</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'gentil_camarades', label: 'Gentil(le) avec les camarades' },
                        { value: 'sociable', label: 'Sociable' },
                        { value: 'cooperatif', label: 'Coopératif(ve)' },
                        { value: 'mal_partager', label: 'A parfois du mal à partager' },
                        { value: 'jouer_seul', label: 'Préfère jouer seul(e)' },
                      ].map((item) => (
                        <div key={item.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`social-${item.value}`}
                            checked={socialRelations.includes(item.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSocialRelations(prev => [...prev, item.value]);
                              } else {
                                setSocialRelations(prev => prev.filter(v => v !== item.value));
                              }
                            }}
                          />
                          <Label htmlFor={`social-${item.value}`} className="text-sm font-normal cursor-pointer">
                            {item.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4" />

                  {/* 4. Gestion des émotions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">4. Gestion des émotions</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'peu_pleure', label: 'A peu pleuré' },
                        { value: 'beaucoup_pleure', label: 'A beaucoup pleuré' },
                        { value: 'besoin_rasseure', label: 'A eu besoin d\'être rassuré(e)' },
                        { value: 'exprime_mieux', label: 'S\'exprime mieux émotionnellement' },
                        { value: 'en_progres', label: 'En progrès dans la gestion des émotions' },
                        { value: 'autonome', label: 'Autonome' },
                      ].map((item) => (
                        <div key={item.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`emotion-${item.value}`}
                            checked={emotionManagement.includes(item.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEmotionManagement(prev => [...prev, item.value]);
                              } else {
                                setEmotionManagement(prev => prev.filter(v => v !== item.value));
                              }
                            }}
                          />
                          <Label htmlFor={`emotion-${item.value}`} className="text-sm font-normal cursor-pointer">
                            {item.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4" />

                  {/* 5. Repas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">5. Repas</h3>
                    <RadioGroup value={meals} onValueChange={setMeals}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bien_mange" id="meals-bien" />
                        <Label htmlFor="meals-bien" className="text-sm font-normal cursor-pointer">
                          Bien mangé
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="peu_mange" id="meals-peu" />
                        <Label htmlFor="meals-peu" className="text-sm font-normal cursor-pointer">
                          Peu mangé
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rien_mange" id="meals-rien" />
                        <Label htmlFor="meals-rien" className="text-sm font-normal cursor-pointer">
                          Rien mangé
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="border-t pt-4" />

                  {/* 6. Observations */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">6. Observations de l'enseignante</h3>
                    <Textarea
                      value={teacherObservations}
                      onChange={(e) => setTeacherObservations(e.target.value)}
                      placeholder="Vos observations..."
                      className="min-h-[120px] resize-none"
                    />
                  </div>

                  <div className="border-t pt-4" />

                  {/* 7. Photos de la période */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">7. Photos de la période</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={(e) => handleMediaUpload(e.target.files)}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingMedia}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Ajouter des photos/vidéos
                        </Button>
                      </div>

                      {/* Preview uploaded files */}
                      {mediaFiles.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {mediaFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              {file.type.startsWith('image/') ? (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-24 object-cover rounded border"
                                />
                              ) : (
                                <div className="w-full h-24 bg-muted rounded border flex items-center justify-center">
                                  <Video className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeMediaFile(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Display existing media URLs */}
                      {mediaUrls.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {mediaUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              {url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') ? (
                                <div className="w-full h-24 bg-muted rounded border flex items-center justify-center">
                                  <Video className="h-8 w-8 text-muted-foreground" />
                                </div>
                              ) : (
                                <img
                                  src={url}
                                  alt={`Media ${index + 1}`}
                                  className="w-full h-24 object-cover rounded border"
                                />
                              )}
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeMediaUrl(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {educatorProfile && (
              <div className="text-right text-sm text-muted-foreground italic pt-4 border-t">
                Signé par: {educatorProfile.first_name} {educatorProfile.last_name}
              </div>
            )}

            {!existingReport?.is_validated && (
              <div className="flex gap-3 justify-end pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleSave(false)}
                  disabled={saving || !selectedChildId || uploadingMedia}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Enregistrer brouillon
                </Button>
                <Button 
                  onClick={() => handleSave(true)}
                  disabled={saving || !selectedChildId || uploadingMedia}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Soumettre
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        {/* Brouillons */}
        <TabsContent value="drafts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mes brouillons
              </CardTitle>
              <CardDescription>
                Retrouvez tous vos rapports sauvegardés en brouillon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DraftWeeklyReportsList 
                onEditDraft={handleEditDraft}
                refreshTrigger={refreshDrafts}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* En Attente de Validation */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Rapports en attente de validation
                  </CardTitle>
                  <CardDescription>
                    Ces rapports ont été soumis et sont en cours de vérification par l'administration
                  </CardDescription>
                </div>
                <Badge variant="default" className="bg-blue-600">
                  En attente
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <WeeklyReportsList
                status="pending"
                onViewReport={handleViewReport}
                refreshTrigger={refreshPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejetés */}
        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Rapports rejetés
                  </CardTitle>
                  <CardDescription>
                    Ces rapports nécessitent des modifications avant d'être soumis à nouveau
                  </CardDescription>
                </div>
                <Badge variant="destructive">
                  Rejetés
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <WeeklyReportsList
                status="rejected"
                onViewReport={handleViewReport}
                onEditReport={handleEditReport}
                refreshTrigger={refreshRejected}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique (Validés) */}
        <TabsContent value="validated">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-green-600" />
                    Historique des rapports validés
                  </CardTitle>
                  <CardDescription>
                    Tous vos rapports approuvés par l'administration
                  </CardDescription>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Validés
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <WeeklyReportsList
                status="validated"
                onViewReport={handleViewReport}
                refreshTrigger={refreshValidated}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
