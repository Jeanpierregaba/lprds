import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Download, Calendar, Loader2, Mail } from "lucide-react";

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
  validated_at: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export default function ParentWeeklyReportsPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChildren();
    }
  }, [user]);

  useEffect(() => {
    if (children.length > 0) {
      fetchReports();
    }
  }, [children, selectedChildId]);

  const fetchChildren = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (profile) {
      const { data } = await supabase
        .from("parent_children")
        .select("children:child_id (id, first_name, last_name)")
        .eq("parent_id", profile.id);

      if (data) {
        const childrenData = data
          .map((item) => item.children)
          .filter((child): child is Child => child !== null);
        setChildren(childrenData);
      }
    }
    setLoading(false);
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
      toast.error("Erreur lors du chargement des rapports");
    } else {
      setReports(data as WeeklyReport[]);
    }
  };

  const getChildName = (childId: string) => {
    const child = children.find((c) => c.id === childId);
    return child ? `${child.first_name} ${child.last_name}` : "";
  };

  const downloadAsPDF = (report: WeeklyReport) => {
    const childName = getChildName(report.child_id);
    const educatorName = report.profiles
      ? `${report.profiles.first_name} ${report.profiles.last_name}`
      : "";

    const printContent = `
      <html>
        <head>
          <title>Rapport Hebdomadaire - ${childName}</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header p {
              margin: 10px 0 0;
              color: #666;
            }
            .content {
              white-space: pre-wrap;
              text-align: justify;
              margin: 30px 0;
            }
            .signature {
              text-align: right;
              margin-top: 40px;
              font-style: italic;
            }
            .footer {
              margin-top: 60px;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Rapport Hebdomadaire</h1>
            <p>${childName}</p>
            <p>Semaine du ${format(new Date(report.week_start_date), "dd MMMM", { locale: fr })} au ${format(new Date(report.week_end_date), "dd MMMM yyyy", { locale: fr })}</p>
          </div>
          <div class="content">${report.content}</div>
          <div class="signature">
            <p>Rédigé par: ${educatorName}</p>
            <p>Le ${format(new Date(report.validated_at || new Date()), "dd MMMM yyyy", { locale: fr })}</p>
          </div>
          <div class="footer">
            <p>Les Petits Rayons de Soleil</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
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
        <Mail className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Rapports Hebdomadaires</h1>
          <p className="text-muted-foreground">Consultez les lettres hebdomadaires de vos enfants</p>
        </div>
      </div>

      {children.length > 1 && (
        <div className="max-w-xs">
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par enfant" />
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
        </div>
      )}

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun rapport hebdomadaire disponible</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{getChildName(report.child_id)}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      Semaine du {format(new Date(report.week_start_date), "dd MMM", { locale: fr })} au{" "}
                      {format(new Date(report.week_end_date), "dd MMM yyyy", { locale: fr })}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => downloadAsPDF(report)}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                  {report.content}
                </div>
                <p className="text-right text-sm italic text-muted-foreground mt-4">
                  Rédigé par: {report.profiles?.first_name} {report.profiles?.last_name}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
