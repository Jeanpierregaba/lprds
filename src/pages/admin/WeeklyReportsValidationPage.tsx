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
import { FileText, Check, X, Loader2, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WeeklyReport {
  id: string;
  child_id: string;
  educator_id: string;
  week_start_date: string;
  week_end_date: string;
  content: string;
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
        *,
        children:child_id (first_name, last_name),
        profiles!weekly_reports_educator_id_fkey (first_name, last_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des rapports");
    } else {
      setReports(data as WeeklyReport[]);
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

  const ReportCard = ({ report, showActions = false }: { report: WeeklyReport; showActions?: boolean }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {report.children?.first_name} {report.children?.last_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Par {report.profiles?.first_name} {report.profiles?.last_name}
            </p>
          </div>
          {getStatusBadge(report.status, report.is_validated)}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Semaine du {format(new Date(report.week_start_date), "dd MMM", { locale: fr })} au{" "}
          {format(new Date(report.week_end_date), "dd MMM yyyy", { locale: fr })}
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 rounded-lg p-4 mb-4 whitespace-pre-wrap text-sm">
          {report.content}
        </div>
        <p className="text-right text-sm italic text-muted-foreground mb-4">
          Signé par: {report.profiles?.first_name} {report.profiles?.last_name}
        </p>
        {report.rejection_reason && (
          <div className="bg-destructive/10 text-destructive rounded p-3 mb-4 text-sm">
            <strong>Motif du rejet:</strong> {report.rejection_reason}
          </div>
        )}
        {showActions && (
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReport(report);
                setRejectDialogOpen(true);
              }}
              disabled={processing}
            >
              <X className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
            <Button onClick={() => handleValidate(report)} disabled={processing}>
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
          <h1 className="text-2xl font-bold">Validation des Rapports Hebdomadaires</h1>
          <p className="text-muted-foreground">Gérez les rapports hebdomadaires des éducateurs</p>
        </div>
      </div>

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
