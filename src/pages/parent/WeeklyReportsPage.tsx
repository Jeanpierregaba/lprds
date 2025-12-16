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
import { FileText, Download, Calendar, Loader2, Mail, Eye, Baby, Pen, Heart } from "lucide-react";

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
  content: string;
  validated_at: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export default function ParentWeeklyReportsPage() {
  const { user, profile } = useAuth();
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
      toast.error("Erreur lors du chargement des rapports");
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
            @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&family=Merriweather:ital,wght@0,400;1,400&display=swap');
            body {
              font-family: 'Merriweather', Georgia, serif;
              padding: 60px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.8;
              background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%);
              min-height: 100vh;
            }
            .letter {
              background: white;
              padding: 50px;
              border-radius: 8px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
              position: relative;
            }
            .letter::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 8px;
              background: linear-gradient(90deg, #f59e0b, #eab308, #f59e0b);
              border-radius: 8px 8px 0 0;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px dashed #f59e0b;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              color: #92400e;
              font-family: 'Dancing Script', cursive;
            }
            .header .child-name {
              font-size: 22px;
              color: #b45309;
              margin: 10px 0;
            }
            .header .period {
              color: #666;
              font-style: italic;
            }
            .salutation {
              font-style: italic;
              margin-bottom: 20px;
              color: #78716c;
            }
            .content {
              white-space: pre-wrap;
              text-align: justify;
              margin: 30px 0;
              color: #44403c;
            }
            .signature {
              text-align: right;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e7e5e4;
            }
            .signature .name {
              font-family: 'Dancing Script', cursive;
              font-size: 24px;
              color: #92400e;
            }
            .signature .date {
              font-size: 12px;
              color: #a8a29e;
              margin-top: 5px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #d6d3d1;
            }
            .sun-icon {
              font-size: 30px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="letter">
            <div class="header">
              <div class="sun-icon">☀️</div>
              <h1>Lettre Hebdomadaire</h1>
              <p class="child-name">${childName}</p>
              <p class="period">Semaine du ${format(new Date(report.week_start_date), "dd MMMM", { locale: fr })} au ${format(new Date(report.week_end_date), "dd MMMM yyyy", { locale: fr })}</p>
            </div>
            <p class="salutation">Chers parents,</p>
            <div class="content">${report.content}</div>
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
            <h1 className="text-2xl font-bold text-foreground">Lettres Hebdomadaires</h1>
            <p className="text-muted-foreground">Découvrez les aventures de la semaine de vos enfants</p>
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
              Les lettres hebdomadaires apparaîtront ici après validation par l'équipe éducative
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
                      "{report.content.substring(0, 150)}..."
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Pen className="h-3 w-3" />
                      {report.profiles?.first_name} {report.profiles?.last_name}
                    </p>
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
              <Avatar className="h-14 w-14 border-2 border-amber-200">
                <AvatarImage src={getChild(selectedReport?.child_id || "")?.photo_url} />
                <AvatarFallback className="bg-amber-100 text-amber-700 text-lg">
                  {getChild(selectedReport?.child_id || "")?.first_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">
                  Lettre de {getChildName(selectedReport?.child_id || "")}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  Semaine du {selectedReport && format(new Date(selectedReport.week_start_date), "dd MMMM", { locale: fr })} au {selectedReport && format(new Date(selectedReport.week_end_date), "dd MMMM yyyy", { locale: fr })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="py-6">
              {/* Letter content */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 rounded-t-xl" />
                
                <p className="text-muted-foreground italic mb-4">Chers parents,</p>
                
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {selectedReport?.content}
                </div>
                
                <div className="mt-8 pt-4 border-t border-amber-200 text-right">
                  <p className="text-amber-800 font-medium">
                    {selectedReport?.profiles?.first_name} {selectedReport?.profiles?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedReport?.validated_at && format(new Date(selectedReport.validated_at), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fermer
            </Button>
            <Button 
              onClick={() => selectedReport && downloadAsPDF(selectedReport)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger / Imprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
