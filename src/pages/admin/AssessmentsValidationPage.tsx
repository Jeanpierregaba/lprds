import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Calendar,
  Edit,
  Save,
  Plus,
  Trash2
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

const DEFAULT_DOMAINS = [
  'Développement et structuration du langage oral et écrit',
  'Agir, s\'exprimer, comprendre à travers les activités physiques',
  'Agir, s\'exprimer, comprendre à travers les activités artistiques',
  'L\'acquisition des premiers outils mathématiques',
  'Explorer le monde',
  'Anglais'
];

const getCurrentSchoolYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // School year starts in September
  if (month >= 8) { // September or later
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
};

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
  
  // Edit form state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [periodName, setPeriodName] = useState('Période 1');
  const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear());
  const [domains, setDomains] = useState<AssessmentDomain[]>([]);
  const [teacherComment, setTeacherComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAssessments();
    fetchChildren();
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

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('id, first_name, last_name, photo_url, section')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
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

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setSelectedChildId(assessment.child_id);
    setPeriodName(assessment.period_name);
    setSchoolYear(assessment.school_year);
    setDomains(assessment.domains.length > 0 ? assessment.domains : DEFAULT_DOMAINS.map(d => ({ domain: d, rating: 'acquis' as const, comment: '' })));
    setTeacherComment(assessment.teacher_comment || '');
    setShowEditForm(true);
    setShowDetails(false);
  };

  const handleAddDomain = () => {
    setDomains([...domains, { domain: '', rating: 'acquis', comment: '' }]);
  };

  const handleRemoveDomain = (index: number) => {
    if (domains.length > 1) {
      setDomains(domains.filter((_, i) => i !== index));
    }
  };

  const handleDomainChange = (index: number, field: keyof AssessmentDomain, value: string) => {
    const updated = [...domains];
    updated[index] = { ...updated[index], [field]: value };
    setDomains(updated);
  };

  const handleSaveEdit = async () => {
    if (!selectedChildId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un enfant',
        variant: 'destructive'
      });
      return;
    }

    if (domains.some(d => !d.domain.trim())) {
      toast({
        title: 'Erreur',
        description: 'Tous les domaines doivent avoir un nom',
        variant: 'destructive'
      });
      return;
    }

    if (!editingAssessment) return;

    setSaving(true);
    try {
      const assessmentData = {
        child_id: selectedChildId,
        period_name: periodName,
        school_year: schoolYear,
        domains: domains as unknown as any,
        teacher_comment: teacherComment,
        assessment_date: editingAssessment.assessment_date || format(new Date(), 'yyyy-MM-dd')
      };

      const { error } = await supabase
        .from('periodic_assessments')
        .update(assessmentData)
        .eq('id', editingAssessment.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Bilan modifié avec succès'
      });

      setShowEditForm(false);
      setEditingAssessment(null);
      resetEditForm();
      fetchAssessments();
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les modifications',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const resetEditForm = () => {
    setSelectedChildId('');
    setPeriodName('Période 1');
    setSchoolYear(getCurrentSchoolYear());
    setDomains(DEFAULT_DOMAINS.map(d => ({ domain: d, rating: 'acquis' as const, comment: '' })));
    setTeacherComment('');
    setEditingAssessment(null);
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(assessment)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
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
                <table className="w-full border-collapse table-fixed">
                  <colgroup>
                    <col className="w-[35%]" />
                    <col className="w-[20%]" />
                    <col className="w-[45%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-muted/50 font-semibold text-sm">
                      <th className="p-4 border-r border-b text-left h-14">Domaines</th>
                      <th className="p-4 border-r border-b text-center h-14">Notation</th>
                      <th className="p-4 border-b text-left h-14">Commentaires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAssessment?.domains.map((domain, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="p-4 border-r align-top min-h-[80px]">
                          <div className="text-sm">{domain.domain}</div>
                        </td>
                        <td className="p-4 border-r align-middle text-center min-h-[80px]">
                          <div className="flex items-center justify-center">
                            {getRatingDisplay(domain.rating)}
                          </div>
                        </td>
                        <td className="p-4 align-top min-h-[80px]">
                          <div className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                            {domain.comment || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            <Button 
              variant="outline" 
              onClick={() => {
                if (selectedAssessment) {
                  handleEdit(selectedAssessment);
                }
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
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

      {/* Edit Form Dialog */}
      <Dialog open={showEditForm} onOpenChange={(open) => {
        setShowEditForm(open);
        if (!open) {
          resetEditForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Modifier le bilan périodique</DialogTitle>
            <DialogDescription>
              Modifiez les informations du bilan
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Child & Period Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Enfant *</Label>
                  <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un enfant" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.first_name} {child.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Période *</Label>
                  <Select value={periodName} onValueChange={setPeriodName}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Période 1">Période 1</SelectItem>
                      <SelectItem value="Période 2">Période 2</SelectItem>
                      <SelectItem value="Période 3">Période 3</SelectItem>
                      <SelectItem value="Période 4">Période 4</SelectItem>
                      <SelectItem value="Période 5">Période 5</SelectItem>
                      <SelectItem value="Trimestre 1">Trimestre 1</SelectItem>
                      <SelectItem value="Trimestre 2">Trimestre 2</SelectItem>
                      <SelectItem value="Trimestre 3">Trimestre 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Année scolaire *</Label>
                  <Input value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} />
                </div>
              </div>

              {/* Domains */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Domaines d'évaluation</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddDomain}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un domaine
                  </Button>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 p-3 bg-muted rounded-lg">
                  {RATING_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <option.icon className={`w-5 h-5 ${option.color}`} />
                      <span className="text-sm">{option.label}</span>
                    </div>
                  ))}
                </div>

                {domains.map((domain, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Domaine</Label>
                              <Input
                                value={domain.domain}
                                onChange={(e) => handleDomainChange(index, 'domain', e.target.value)}
                                placeholder="Nom du domaine"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Notation</Label>
                              <Select 
                                value={domain.rating} 
                                onValueChange={(v) => handleDomainChange(index, 'rating', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {RATING_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center gap-2">
                                        <option.icon className={`w-4 h-4 ${option.color}`} />
                                        {option.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Commentaire</Label>
                            <Textarea
                              value={domain.comment}
                              onChange={(e) => handleDomainChange(index, 'comment', e.target.value)}
                              placeholder="Commentaire sur les progrès de l'enfant dans ce domaine..."
                              rows={3}
                            />
                          </div>
                        </div>
                        {domains.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveDomain(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Teacher Comment */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Petit mot de la maîtresse</Label>
                <Textarea
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
                  placeholder="Un mot d'encouragement personnel pour l'enfant..."
                  rows={4}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => {
              setShowEditForm(false);
              resetEditForm();
            }}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentsValidationPage;
