import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  FilePlus,
  Loader2,
  Upload,
  Video,
  X,
  Trash2,
  Send,
  Save,
} from "lucide-react";
import { toast } from "sonner";

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  section?: string;
}

interface WeeklyReport {
  id: string;
  child_id: string;
  week_start_date: string;
  week_end_date: string;
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
}

const BiMonthlyReportsManagement = () => {
  const { profile } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [periodStartDate, setPeriodStartDate] = useState<Date | undefined>(new Date());
  const [periodEndDate, setPeriodEndDate] = useState<Date | undefined>(addDays(new Date(), 13));
  const [existingReport, setExistingReport] = useState<WeeklyReport | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state (mêmes champs que chez l'éducatrice)
  const [activitiesLearning, setActivitiesLearning] = useState({
    langage_oral_ecrit: "",
    activites_physiques: "",
    activites_artistiques: "",
    outils_mathematiques: "",
    explorer_monde: "",
    anglais: "",
  });
  const [behaviorAttitude, setBehaviorAttitude] = useState<string[]>([]);
  const [socialRelations, setSocialRelations] = useState<string[]>([]);
  const [emotionManagement, setEmotionManagement] = useState<string[]>([]);
  const [meals, setMeals] = useState<string>("");
  const [teacherObservations, setTeacherObservations] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const isAdmin = profile?.role === "admin" || profile?.role === "secretary";
  const isEducator = profile?.role === "educator";

  useEffect(() => {
    if (profile) {
      fetchChildren();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedChild && periodStartDate && periodEndDate) {
      checkExistingReport();
    }
  }, [selectedChild, periodStartDate, periodEndDate]);

  const fetchChildren = async () => {
    try {
      let query = supabase.from("children").select("id, first_name, last_name, section").eq("status", "active");

      if (isEducator) {
        // Même logique que pour le suivi quotidien : les éducateurs ne voient que leurs enfants
        const { data: educatorChildren } = await supabase.rpc("get_educator_children", {
          user_uuid: profile?.user_id,
        });

        if (educatorChildren) {
          query = query.in("id", educatorChildren);
        }
      }

      const { data, error } = await query.order("first_name");

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error("Error fetching children for bi-monthly reports:", error);
      toast.error("Impossible de charger la liste des enfants");
    }
  };

  const checkExistingReport = async () => {
    if (!selectedChild || !periodStartDate) return;
    const periodStart = format(periodStartDate, "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("child_id", selectedChild.id)
      .eq("week_start_date", periodStart)
      .maybeSingle();

    if (error) {
      console.error("Erreur lors de la vérification du rapport bi-mensuel (admin):", error);
      return;
    }

    if (data) {
      const reportData = data as any as WeeklyReport;
      setExistingReport(reportData);

      const structured =
        (reportData as any).activities_learning ||
        (reportData as any).content?.activities_learning ||
        {};

      setActivitiesLearning({
        langage_oral_ecrit: (structured as any).langage_oral_ecrit || "",
        activites_physiques: (structured as any).activites_physiques || "",
        activites_artistiques: (structured as any).activites_artistiques || "",
        outils_mathematiques: (structured as any).outils_mathematiques || "",
        explorer_monde: (structured as any).explorer_monde || "",
        anglais: (structured as any).anglais || "",
      });

      const behavior =
        (reportData as any).behavior_attitude ||
        (reportData as any).content?.behavior_attitude ||
        [];
      setBehaviorAttitude(behavior);

      const social =
        (reportData as any).social_relations ||
        (reportData as any).content?.social_relations ||
        [];
      setSocialRelations(social);

      const emotions =
        (reportData as any).emotion_management ||
        (reportData as any).content?.emotion_management ||
        [];
      setEmotionManagement(emotions);

      const mealsValue =
        (reportData as any).meals ||
        (reportData as any).content?.meals ||
        "";
      setMeals(mealsValue);

      const teacherObs =
        (reportData as any).teacher_observations ||
        (reportData as any).content?.teacher_observations ||
        "";
      setTeacherObservations(teacherObs);

      const media =
        (reportData as any).media_files ||
        (reportData as any).content?.media_files ||
        [];
      setMediaUrls(media);
    } else {
      setExistingReport(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setActivitiesLearning({
      langage_oral_ecrit: "",
      activites_physiques: "",
      activites_artistiques: "",
      outils_mathematiques: "",
      explorer_monde: "",
      anglais: "",
    });
    setBehaviorAttitude([]);
    setSocialRelations([]);
    setEmotionManagement([]);
    setMeals("");
    setTeacherObservations("");
    setMediaUrls([]);
    setMediaFiles([]);
  };

  const handleMediaUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
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

    setMediaFiles((prev) => [...prev, ...validFiles]);
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeMediaUrl = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMediaFiles = async (reportId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of mediaFiles) {
      try {
        setUploadingMedia(true);
        const fileExt = file.name.split(".").pop();
        const fileName = `weekly-reports/${reportId}/${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const fileType = file.type.startsWith("video/") ? "vidéo" : "photo";

        const { error: uploadError } = await supabase.storage
          .from("daily-reports")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error(`Erreur upload ${fileType}:`, uploadError);
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("daily-reports").getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      } catch (error: any) {
        console.error("Erreur upload média:", error);
        toast.error(`Impossible d'uploader ${file.name}`);
      }
    }

    setUploadingMedia(false);
    return uploadedUrls;
  };

  const handleSave = async (submit: boolean) => {
    if (!selectedChild) {
      toast.error("Veuillez sélectionner un enfant");
      return;
    }

    if (!periodStartDate || !periodEndDate) {
      toast.error("Veuillez sélectionner les dates de début et de fin de période");
      return;
    }

    if (periodEndDate < periodStartDate) {
      toast.error("La date de fin doit être postérieure à la date de début");
      return;
    }

    if (!profile) {
      toast.error("Profil non trouvé");
      return;
    }

    setSaving(true);
    const periodStart = format(periodStartDate, "yyyy-MM-dd");
    const periodEnd = format(periodEndDate, "yyyy-MM-dd");

    const isAdminSubmission = isAdmin && submit;

    const reportData: any = {
      child_id: selectedChild.id,
      educator_id: profile.id,
      week_start_date: periodStart,
      week_end_date: periodEnd,
      activities_learning: activitiesLearning,
      behavior_attitude: behaviorAttitude,
      social_relations: socialRelations,
      emotion_management: emotionManagement,
      meals: meals,
      teacher_observations: teacherObservations.trim(),
      media_files: mediaUrls,
      status: isAdminSubmission ? "validated" : submit ? "pending" : "draft",
      is_validated: isAdminSubmission ? true : existingReport?.is_validated || false,
    };

    if (isAdminSubmission) {
      reportData.validated_by = profile.id;
      reportData.validated_at = new Date().toISOString();
    }

    let error;
    let reportId = existingReport?.id;

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
      if (insertData) reportId = (insertData as any).id;
    }

    if (!error && reportId && mediaFiles.length > 0) {
      const uploadedUrls = await uploadMediaFiles(reportId);
      if (uploadedUrls.length > 0) {
        const updatedMediaUrls = [...mediaUrls, ...uploadedUrls];
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
      console.error("Erreur lors de l'enregistrement du rapport bi-mensuel (admin):", {
        error,
        reportData,
        existingReport,
      });
      const message =
        (error as any)?.message ||
        (error as any)?.hint ||
        "Erreur lors de l'enregistrement";
      toast.error(message);
    } else {
      toast.success(
        isAdminSubmission
          ? "Rapport enregistré et validé"
          : submit
          ? "Rapport soumis pour validation"
          : "Brouillon enregistré"
      );
      checkExistingReport();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FilePlus className="h-5 w-5" />
          Remplir un rapport bi-mensuel
        </CardTitle>
        <CardDescription>
          {isAdmin
            ? "En tant qu'administrateur, vous pouvez créer ou compléter un rapport bi-mensuel pour n'importe quel enfant."
            : "Créez ou complétez un rapport bi-mensuel pour l'enfant sélectionné."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Enfant</Label>
            <Select
              value={selectedChild?.id || ""}
              onValueChange={(value) => {
                const child = children.find((c) => c.id === value) || null;
                setSelectedChild(child);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un enfant" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                    {child.section ? ` (${child.section})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date de début</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !periodStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodStartDate ? (
                    format(periodStartDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={periodStartDate}
                  onSelect={(date) => {
                    setPeriodStartDate(date || undefined);
                    if (date && periodEndDate && date > periodEndDate) {
                      setPeriodEndDate(addDays(date, 13));
                    }
                  }}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Date de fin</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !periodEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodEndDate ? (
                    format(periodEndDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={periodEndDate}
                  onSelect={(date) => setPeriodEndDate(date || undefined)}
                  disabled={(date) => {
                    if (periodStartDate) {
                      return date < periodStartDate;
                    }
                    return false;
                  }}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {existingReport && (
          <div className="flex items-center gap-2">
            <Badge
              className={
                existingReport.is_validated
                  ? "bg-green-500"
                  : existingReport.status === "pending"
                  ? "bg-yellow-500"
                  : existingReport.status === "rejected"
                  ? "bg-red-500"
                  : "bg-muted"
              }
            >
              {existingReport.is_validated
                ? "Validé"
                : existingReport.status === "pending"
                ? "En attente"
                : existingReport.status === "rejected"
                ? "Rejeté"
                : "Brouillon"}
            </Badge>
            {existingReport.rejection_reason && (
              <span className="text-sm text-destructive">
                Motif: {existingReport.rejection_reason}
              </span>
            )}
          </div>
        )}

        {selectedChild && (
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
                      onChange={(e) =>
                        setActivitiesLearning((prev) => ({
                          ...prev,
                          langage_oral_ecrit: e.target.value,
                        }))
                      }
                      placeholder="Observations..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Agir, s'exprimer, comprendre à travers les activités physiques</Label>
                    <Textarea
                      value={activitiesLearning.activites_physiques}
                      onChange={(e) =>
                        setActivitiesLearning((prev) => ({
                          ...prev,
                          activites_physiques: e.target.value,
                        }))
                      }
                      placeholder="Observations..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Agir, s'exprimer, comprendre à travers les activités artistiques</Label>
                    <Textarea
                      value={activitiesLearning.activites_artistiques}
                      onChange={(e) =>
                        setActivitiesLearning((prev) => ({
                          ...prev,
                          activites_artistiques: e.target.value,
                        }))
                      }
                      placeholder="Observations..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>L'acquisition des premiers outils mathématiques</Label>
                    <Textarea
                      value={activitiesLearning.outils_mathematiques}
                      onChange={(e) =>
                        setActivitiesLearning((prev) => ({
                          ...prev,
                          outils_mathematiques: e.target.value,
                        }))
                      }
                      placeholder="Observations..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Explorer le monde</Label>
                    <Textarea
                      value={activitiesLearning.explorer_monde}
                      onChange={(e) =>
                        setActivitiesLearning((prev) => ({
                          ...prev,
                          explorer_monde: e.target.value,
                        }))
                      }
                      placeholder="Observations..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Anglais</Label>
                    <Textarea
                      value={activitiesLearning.anglais}
                      onChange={(e) =>
                        setActivitiesLearning((prev) => ({
                          ...prev,
                          anglais: e.target.value,
                        }))
                      }
                      placeholder="Observations..."
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
                    { value: "calme", emoji: "😌", label: "Calme" },
                    { value: "joyeux", emoji: "😊", label: "Joyeux(se)" },
                    { value: "souriant", emoji: "😄", label: "Souriant(e)" },
                    { value: "participatif", emoji: "🙋", label: "Participatif(ve)" },
                    { value: "reserve", emoji: "🤐", label: "Réservé(e)" },
                    { value: "dynamique", emoji: "⚡", label: "Dynamique" },
                    { value: "agite", emoji: "😅", label: "Agité(e)" },
                    { value: "fatigue", emoji: "😴", label: "Fatigué(e)" },
                    { value: "emotif", emoji: "😢", label: "Émotif(ve)" },
                  ].map((item) => (
                    <div key={item.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`behavior-admin-${item.value}`}
                        checked={behaviorAttitude.includes(item.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBehaviorAttitude((prev) => [...prev, item.value]);
                          } else {
                            setBehaviorAttitude((prev) => prev.filter((v) => v !== item.value));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`behavior-admin-${item.value}`}
                        className="text-sm font-normal cursor-pointer flex items-center gap-1"
                      >
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
                <h3 className="text-lg font-semibold">3. Relation avec les autres</h3>
                <div className="space-y-2">
                  {[
                    { value: "gentil_camarades", label: "Gentil(le) avec les camarades" },
                    { value: "sociable", label: "Sociable" },
                    { value: "cooperatif", label: "Coopératif(ve)" },
                    { value: "mal_partager", label: "A parfois du mal à partager" },
                    { value: "jouer_seul", label: "Préfère jouer seul(e)" },
                  ].map((item) => (
                    <div key={item.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`social-admin-${item.value}`}
                        checked={socialRelations.includes(item.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSocialRelations((prev) => [...prev, item.value]);
                          } else {
                            setSocialRelations((prev) => prev.filter((v) => v !== item.value));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`social-admin-${item.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
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
                    { value: "peu_pleure", label: "A peu pleuré" },
                    { value: "beaucoup_pleure", label: "A beaucoup pleuré" },
                    { value: "besoin_rasseure", label: "A eu besoin d'être rassuré(e)" },
                    { value: "exprime_mieux", label: "S'exprime mieux émotionnellement" },
                    { value: "en_progres", label: "En progrès dans la gestion des émotions" },
                    { value: "autonome", label: "Autonome" },
                  ].map((item) => (
                    <div key={item.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`emotion-admin-${item.value}`}
                        checked={emotionManagement.includes(item.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEmotionManagement((prev) => [...prev, item.value]);
                          } else {
                            setEmotionManagement((prev) => prev.filter((v) => v !== item.value));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`emotion-admin-${item.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4" />

              {/* 5. Photos de la période */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">5. Photos de la période</h3>
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
                          {file.type.startsWith("image/") ? (
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

                  {/* Existing media URLs */}
                  {mediaUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {mediaUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          {url.includes(".mp4") ||
                          url.includes(".mov") ||
                          url.includes(".avi") ? (
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
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving || !selectedChild || uploadingMedia}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer brouillon
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving || !selectedChild || uploadingMedia}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isAdmin ? "Soumettre & valider" : "Soumettre"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BiMonthlyReportsManagement;

