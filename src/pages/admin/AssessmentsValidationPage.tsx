import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Sun,
  Star,
  Cloud,
  Eye,
  User,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  status: 'draft' | 'pending' | 'validated' | 'rejected';
  is_validated: boolean;
  rejection_reason?: string;
  created_at: string;
  child?: Child;
  educator?: Educator;
}

const RATING_OPTIONS = [
  { value: 'acquis', label: 'Acquis', icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  { value: 'en_cours', label: 'En cours d\'acquisition', icon: Star, color: 'text-orange-500', bg: 'bg-orange-100' },
  { value: 'a_consolider', label: 'À consolider', icon: Cloud, color: 'text-blue-400', bg: 'bg-blue-100' }
];

const AssessmentsValidationPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('periodic_assessments')
        .select(`
          *,
          child:children(id, first_name, last_name, photo_url, section),
          educator:profiles!periodic_assessments_educator_id_fkey(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        domains: (Array.isArray(item.domains) ? item.domains : []) as unknown as AssessmentDomain[],
        status: item.status as Assessment['status']
      }));
      
      setAssessments(transformedData as Assessment[]);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les bilans',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('periodic_assessments')
        .update({
          status: 'validated',
          is_validated: true,
          validated_by: profile?.id,
          validated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Bilan validé et disponible pour les parents'
      });

      setShowDetails(false);
      setSelectedAssessment(null);
      fetchAssessments();
    } catch (error) {
      console.error('Error validating assessment:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de valider le bilan',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez indiquer la raison du rejet',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('periodic_assessments')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Bilan rejeté',
        description: 'L\'éducatrice sera notifiée pour correction'
      });

      setShowDetails(false);
      setSelectedAssessment(null);
      setRejectionReason('');
      fetchAssessments();
    } catch (error) {
      console.error('Error rejecting assessment:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter le bilan',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      draft: { label: 'Brouillon', variant: 'secondary', icon: FileText },
      pending: { label: 'En attente', variant: 'default', icon: Clock },
      validated: { label: 'Validé', variant: 'outline', icon: CheckCircle },
      rejected: { label: 'Rejeté', variant: 'destructive', icon: XCircle }
    };
    const { label, variant, icon: Icon } = config[status] || config.draft;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const getRatingDisplay = (rating: string) => {
    const option = RATING_OPTIONS.find(r => r.value === rating);
    if (!option) return null;
    const Icon = option.icon;
    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${option.bg}`}>
        <Icon className={`w-5 h-5 ${option.color}`} />
        <span className="text-sm font-medium">{option.label}</span>
      </div>
    );
  };

  const filteredAssessments = assessments.filter(a => {
    if (selectedTab === 'pending') return a.status === 'pending';
    if (selectedTab === 'validated') return a.status === 'validated';
    if (selectedTab === 'rejected') return a.status === 'rejected';
    return true;
  });

  const pendingCount = assessments.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Validation des Bilans</h1>
        <p className="text-muted-foreground">
          Examinez et validez les bilans périodiques avant leur envoi aux parents
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            En attente
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="validated">Validés</TabsTrigger>
          <TabsTrigger value="rejected">Rejetés</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredAssessments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun bilan dans cette catégorie</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAssessments.map((assessment) => (
                <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={assessment.child?.photo_url} />
                          <AvatarFallback>
                            {assessment.child?.first_name?.charAt(0)}
                            {assessment.child?.last_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {assessment.child?.first_name} {assessment.child?.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {assessment.period_name} - {assessment.school_year}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <User className="w-3 h-3" />
                            Par {assessment.educator?.first_name} {assessment.educator?.last_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(assessment.status)}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedAssessment?.child?.photo_url} />
                <AvatarFallback>
                  {selectedAssessment?.child?.first_name?.charAt(0)}
                  {selectedAssessment?.child?.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span>{selectedAssessment?.child?.first_name} {selectedAssessment?.child?.last_name}</span>
                <p className="text-sm font-normal text-muted-foreground">
                  {selectedAssessment?.period_name} - {selectedAssessment?.school_year}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Rédigé par {selectedAssessment?.educator?.first_name} {selectedAssessment?.educator?.last_name}
              {selectedAssessment?.assessment_date && (
                <span> le {format(new Date(selectedAssessment.assessment_date), 'dd MMMM yyyy', { locale: fr })}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-6">
              {/* Rating Legend */}
              <div className="flex flex-wrap gap-3 p-3 bg-muted rounded-lg">
                {RATING_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <option.icon className={`w-5 h-5 ${option.color}`} />
                    <span className="text-sm">{option.label}</span>
                  </div>
                ))}
              </div>

              {/* Domains Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr,auto,2fr] bg-muted/50 font-semibold text-sm">
                  <div className="p-3 border-r">Domaines</div>
                  <div className="p-3 border-r text-center">Notation</div>
                  <div className="p-3">Commentaires</div>
                </div>
                {selectedAssessment?.domains.map((domain, index) => (
                  <div key={index} className="grid grid-cols-[1fr,auto,2fr] border-t">
                    <div className="p-3 border-r text-sm">{domain.domain}</div>
                    <div className="p-3 border-r flex items-center justify-center">
                      {getRatingDisplay(domain.rating)}
                    </div>
                    <div className="p-3 text-sm text-muted-foreground">{domain.comment || '-'}</div>
                  </div>
                ))}
              </div>

              {/* Teacher Comment */}
              {selectedAssessment?.teacher_comment && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-amber-800">
                      Petit mot de la maîtresse
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-amber-900 italic">{selectedAssessment.teacher_comment}</p>
                  </CardContent>
                </Card>
              )}

              {/* Rejection reason input (only for pending) */}
              {selectedAssessment?.status === 'pending' && (
                <div className="space-y-2">
                  <Label>Raison du rejet (si applicable)</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Indiquez la raison du rejet pour que l'éducatrice puisse corriger..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fermer
            </Button>
            {selectedAssessment?.status === 'pending' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleReject(selectedAssessment.id)}
                  disabled={processing}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
                <Button 
                  onClick={() => handleValidate(selectedAssessment.id)}
                  disabled={processing}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider et publier
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentsValidationPage;
