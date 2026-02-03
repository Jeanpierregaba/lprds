import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Save, X, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WeeklyReport {
  id: string;
  child_id: string;
  educator_id: string;
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
  children?: {
    first_name: string;
    last_name: string;
  };
}

interface EditWeeklyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: WeeklyReport | null;
  onReportUpdated: () => void;
}

export default function EditWeeklyReportDialog({
  open,
  onOpenChange,
  report,
  onReportUpdated,
}: EditWeeklyReportDialogProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  
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

  useEffect(() => {
    if (user) {
      fetchAdminProfile();
    }
  }, [user]);

  useEffect(() => {
    if (report && open) {
      loadReportData();
    }
  }, [report, open]);

  const fetchAdminProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("user_id", user?.id)
      .single();
    
    if (data) setAdminProfile(data);
  };

  const loadReportData = () => {
    if (!report) return;

    // Load form data from report
    const structured = report.activities_learning || {};
    setActivitiesLearning({
      langage_oral_ecrit: structured.langage_oral_ecrit || "",
      activites_physiques: structured.activites_physiques || "",
      activites_artistiques: structured.activites_artistiques || "",
      outils_mathematiques: structured.outils_mathematiques || "",
      explorer_monde: structured.explorer_monde || "",
      anglais: structured.anglais || "",
    });
    
    setBehaviorAttitude(report.behavior_attitude || []);
    setSocialRelations(report.social_relations || []);
    setEmotionManagement(report.emotion_management || []);
    setMeals(report.meals || "");
    setTeacherObservations(report.teacher_observations || "");
  };

  const handleSave = async () => {
    if (!report || !adminProfile) {
      toast.error("Informations manquantes");
      return;
    }

    setSaving(true);

    const reportData = {
      activities_learning: activitiesLearning,
      behavior_attitude: behaviorAttitude,
      social_relations: socialRelations,
      emotion_management: emotionManagement,
      meals: meals,
      teacher_observations: teacherObservations.trim(),
      // Keep original status but clear rejection reason when edited by admin
      rejection_reason: null,
    };

    const { error } = await supabase
      .from("weekly_reports")
      .update(reportData)
      .eq("id", report.id);

    setSaving(false);

    if (error) {
      console.error("Erreur lors de la modification du rapport:", {
        error,
        reportData,
        reportId: report.id
      });
      toast.error(`Erreur: ${error.message || "Erreur lors de la modification du rapport"}`);
    } else {
      toast.success("Rapport modifié avec succès");
      onReportUpdated();
      onOpenChange(false);
    }
  };

  const behaviorOptions = [
    { value: 'calme', emoji: '😌', label: 'Calme' },
    { value: 'joyeux', emoji: '😊', label: 'Joyeux(se)' },
    { value: 'souriant', emoji: '😄', label: 'Souriant(e)' },
    { value: 'participatif', emoji: '🙋', label: 'Participatif(ve)' },
    { value: 'reserve', emoji: '🤐', label: 'Réservé(e)' },
    { value: 'dynamique', emoji: '⚡', label: 'Dynamique' },
    { value: 'agite', emoji: '😅', label: 'Agité(e)' },
    { value: 'fatigue', emoji: '😴', label: 'Fatigué(e)' },
    { value: 'emotif', emoji: '😢', label: 'Émotif(ve)' },
  ];

  const socialOptions = [
    { value: 'gentil_camarades', label: 'Gentil(le) avec les camarades' },
    { value: 'sociable', label: 'Sociable' },
    { value: 'cooperatif', label: 'Coopératif(ve)' },
    { value: 'mal_partager', label: 'A parfois du mal à partager' },
    { value: 'jouer_seul', label: 'Préfère jouer seul(e)' },
  ];

  const emotionOptions = [
    { value: 'peu_pleure', label: 'A peu pleuré' },
    { value: 'beaucoup_pleure', label: 'A beaucoup pleuré' },
    { value: 'besoin_rasseure', label: 'A eu besoin d\'être rassuré(e)' },
    { value: 'exprime_mieux', label: 'S\'exprime mieux émotionnellement' },
    { value: 'en_progres', label: 'En progrès dans la gestion des émotions' },
    { value: 'autonome', label: 'Autonome' },
  ];

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le rapport bi-mensuel</DialogTitle>
          <DialogDescription>
            {report.children?.first_name} {report.children?.last_name} - Période du{" "}
            {format(new Date(report.week_start_date), "dd MMM yyyy", { locale: fr })}{" "}
            au{" "}
            {format(new Date(report.week_end_date), "dd MMM yyyy", { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status info */}
          <div className="flex items-center gap-2">
            <Badge variant={report.status === 'pending' ? 'default' : report.status === 'rejected' ? 'destructive' : 'secondary'}>
              {report.status === 'pending' ? 'En attente' : report.status === 'rejected' ? 'Rejeté' : 'Brouillon'}
            </Badge>
            {report.rejection_reason && (
              <span className="text-sm text-destructive">
                Motif de rejet: {report.rejection_reason}
              </span>
            )}
          </div>

          {/* 1. Activités & apprentissages */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Activités & apprentissages</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Développement et structuration du langage oral et écrit</Label>
                <Textarea
                  value={activitiesLearning.langage_oral_ecrit}
                  onChange={(e) => setActivitiesLearning(prev => ({ ...prev, langage_oral_ecrit: e.target.value }))}
                  placeholder="Observations..."
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Agir, s'exprimer, comprendre à travers les activités physiques</Label>
                <Textarea
                  value={activitiesLearning.activites_physiques}
                  onChange={(e) => setActivitiesLearning(prev => ({ ...prev, activites_physiques: e.target.value }))}
                  placeholder="Observations..."
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Agir, s'exprimer, comprendre à travers les activités artistiques</Label>
                <Textarea
                  value={activitiesLearning.activites_artistiques}
                  onChange={(e) => setActivitiesLearning(prev => ({ ...prev, activites_artistiques: e.target.value }))}
                  placeholder="Observations..."
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>L'acquisition des premiers outils mathématiques</Label>
                <Textarea
                  value={activitiesLearning.outils_mathematiques}
                  onChange={(e) => setActivitiesLearning(prev => ({ ...prev, outils_mathematiques: e.target.value }))}
                  placeholder="Observations..."
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Explorer le monde</Label>
                <Textarea
                  value={activitiesLearning.explorer_monde}
                  onChange={(e) => setActivitiesLearning(prev => ({ ...prev, explorer_monde: e.target.value }))}
                  placeholder="Observations..."
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Anglais</Label>
                <Textarea
                  value={activitiesLearning.anglais}
                  onChange={(e) => setActivitiesLearning(prev => ({ ...prev, anglais: e.target.value }))}
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
              {behaviorOptions.map((item) => (
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
            <h3 className="text-lg font-semibold">3. Relation avec les autres</h3>
            <div className="space-y-2">
              {socialOptions.map((item) => (
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
              {emotionOptions.map((item) => (
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

          {/* 6. Observations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">5. Observations de l'enseignante</h3>
            <Textarea
              value={teacherObservations}
              onChange={(e) => setTeacherObservations(e.target.value)}
              placeholder="Vos observations..."
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="border-t pt-4" />

          {/* Admin signature */}
          <div className="text-right text-sm text-muted-foreground italic">
            Modifié par: {adminProfile?.first_name} {adminProfile?.last_name}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
