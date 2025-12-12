import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Save, Send, Calendar, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  content: string;
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
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [content, setContent] = useState("");
  const [educatorProfile, setEducatorProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingReport, setExistingReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    if (user) {
      fetchEducatorProfile();
      fetchChildren();
      fetchReports();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChildId && selectedWeek) {
      checkExistingReport();
    }
  }, [selectedChildId, selectedWeek]);

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
      const { data } = await supabase
        .from("children")
        .select("id, first_name, last_name")
        .eq("assigned_educator_id", profile.id)
        .eq("status", "active")
        .order("first_name");
      
      if (data) setChildren(data);
    }
    setLoading(false);
  };

  const fetchReports = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (profile) {
      const { data } = await supabase
        .from("weekly_reports")
        .select(`
          *,
          children:child_id (id, first_name, last_name)
        `)
        .eq("educator_id", profile.id)
        .order("created_at", { ascending: false });
      
      if (data) setReports(data as WeeklyReport[]);
    }
  };

  const checkExistingReport = async () => {
    const weekStart = format(selectedWeek, "yyyy-MM-dd");
    
    const { data } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("child_id", selectedChildId)
      .eq("week_start_date", weekStart)
      .maybeSingle();
    
    if (data) {
      setExistingReport(data);
      setContent(data.content);
    } else {
      setExistingReport(null);
      setContent("");
    }
  };

  const handleSave = async (submit: boolean = false) => {
    if (!selectedChildId || !content.trim()) {
      toast.error("Veuillez sélectionner un enfant et rédiger le contenu");
      return;
    }

    if (!educatorProfile) {
      toast.error("Profil éducateur non trouvé");
      return;
    }

    setSaving(true);
    const weekStart = format(selectedWeek, "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), "yyyy-MM-dd");

    const reportData = {
      child_id: selectedChildId,
      educator_id: educatorProfile.id,
      week_start_date: weekStart,
      week_end_date: weekEnd,
      content: content.trim(),
      status: submit ? "pending" : "draft",
    };

    let error;
    if (existingReport) {
      const { error: updateError } = await supabase
        .from("weekly_reports")
        .update(reportData)
        .eq("id", existingReport.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("weekly_reports")
        .insert(reportData);
      error = insertError;
    }

    setSaving(false);

    if (error) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    } else {
      toast.success(submit ? "Rapport soumis pour validation" : "Brouillon enregistré");
      fetchReports();
      checkExistingReport();
    }
  };

  const getWeekOptions = () => {
    const weeks = [];
    const today = new Date();
    for (let i = 0; i < 8; i++) {
      const weekStart = startOfWeek(addDays(today, -i * 7), { weekStartsOn: 1 });
      weeks.push(weekStart);
    }
    return weeks;
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
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Rapports Hebdomadaires</h1>
          <p className="text-muted-foreground">Rédigez des lettres hebdomadaires pour les parents</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Nouveau Rapport
            </CardTitle>
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
                <Label>Semaine</Label>
                <Select 
                  value={selectedWeek.toISOString()} 
                  onValueChange={(val) => setSelectedWeek(new Date(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getWeekOptions().map((week) => (
                      <SelectItem key={week.toISOString()} value={week.toISOString()}>
                        {format(week, "dd MMM", { locale: fr })} - {format(endOfWeek(week, { weekStartsOn: 1 }), "dd MMM yyyy", { locale: fr })}
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

            <div className="space-y-2">
              <Label>Contenu de la lettre</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chers parents,&#10;&#10;Cette semaine, votre enfant..."
                className="min-h-[300px] resize-none"
                disabled={existingReport?.is_validated}
              />
            </div>

            {educatorProfile && (
              <div className="text-right text-sm text-muted-foreground italic">
                Signé par: {educatorProfile.first_name} {educatorProfile.last_name}
              </div>
            )}

            {!existingReport?.is_validated && (
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => handleSave(false)}
                  disabled={saving || !selectedChildId}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Enregistrer brouillon
                </Button>
                <Button 
                  onClick={() => handleSave(true)}
                  disabled={saving || !selectedChildId || !content.trim()}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Soumettre
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des rapports */}
        <Card>
          <CardHeader>
            <CardTitle>Mes Rapports</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun rapport hebdomadaire
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedChildId(report.child_id);
                      setSelectedWeek(new Date(report.week_start_date));
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {report.children?.first_name} {report.children?.last_name}
                      </span>
                      {getStatusBadge(report.status, report.is_validated || false)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Semaine du {format(new Date(report.week_start_date), "dd MMM", { locale: fr })} au {format(new Date(report.week_end_date), "dd MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
