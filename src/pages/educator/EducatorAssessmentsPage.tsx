import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  FileText, 
  Send, 
  Save, 
  Trash2, 
  Sun, 
  Star, 
  Cloud,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Eye
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
}

const RATING_OPTIONS = [
  { value: 'acquis', label: 'Acquis', icon: Sun, color: 'text-yellow-500' },
  { value: 'en_cours', label: 'En cours d\'acquisition', icon: Star, color: 'text-orange-500' },
  { value: 'a_consolider', label: 'À consolider', icon: Cloud, color: 'text-blue-400' }
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

const EducatorAssessmentsPage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [children, setChildren] = useState<Child[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [selectedTab, setSelectedTab] = useState('drafts');
  
  // Form state
  const [selectedChildId, setSelectedChildId] = useState('');
  const [periodName, setPeriodName] = useState('Période 1');
  const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear());
  const [domains, setDomains] = useState<AssessmentDomain[]>(
    DEFAULT_DOMAINS.map(d => ({ domain: d, rating: 'acquis' as const, comment: '' }))
  );
  const [teacherComment, setTeacherComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [educatorProfileId, setEducatorProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      setEducatorProfileId(profile.id);
      initializeEducatorData();
    }
  }, [profile]);

  const initializeEducatorData = async () => {
    try {
      if (!profile?.id) {
        return;
      }

      await Promise.all([
        fetchChildren(profile.id),
        fetchAssessments(profile.id)
      ]);
    } catch (error) {
      console.error('Error initializing educator data for assessments:', error);
    }
  };

  const fetchChildren = async (educatorId?: string) => {
    try {
      const effectiveEducatorId = educatorId || educatorProfileId;
      if (!effectiveEducatorId) {
        return;
      }

      // Get all group ids for this educator
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id')
        .eq('assigned_educator_id', effectiveEducatorId);

      if (groupsError) {
        console.error('Error fetching groups for educator:', groupsError);
      }

      const groupIds = (groupsData || []).map(g => g.id).filter(Boolean);

      // Direct/group children
      const orFilters = [`assigned_educator_id.eq.${effectiveEducatorId}`];
      if (groupIds.length > 0) {
        orFilters.push(`group_id.in.(${groupIds.join(',')})`);
      }

      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('id, first_name, last_name, photo_url, section')
        .eq('status', 'active')
        .or(orFilters.join(','))
        .order('first_name');

      if (childrenError) {
        console.error('Error fetching children:', childrenError);
        return;
      }

      // Children assigned directly to this educator
      const { data: directChildren } = await supabase
        .from('children')
        .select('id')
        .eq('assigned_educator_id', effectiveEducatorId)
        .eq('status', 'active');
      const childIds = (directChildren || []).map((c: any) => c.id);

      let extraChildren: any[] = [];
      if (childIds.length > 0) {
        const { data: extraData, error: extraError } = await supabase
          .from('children')
          .select('id, first_name, last_name, photo_url, section')
          .eq('status', 'active')
          .in('id', childIds)
          .order('first_name');
        if (extraError) {
          console.error('Error fetching linked children:', extraError);
        } else {
          extraChildren = extraData || [];
        }
      }

      // Remove duplicates based on id
      const uniqueChildren = ([...(childrenData || []), ...extraChildren]).filter((child, index, self) =>
        index === self.findIndex((c) => c.id === child.id)
      );

      setChildren(uniqueChildren);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const fetchAssessments = async (educatorId?: string) => {
    try {
      const effectiveEducatorId = educatorId || educatorProfileId;
      if (!effectiveEducatorId) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('periodic_assessments')
        .select(`
          *,
          child:children(id, first_name, last_name, photo_url, section)
        `)
        .eq('educator_id', effectiveEducatorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        domains: (Array.isArray(item.domains) ? item.domains : []) as unknown as AssessmentDomain[],
        status: item.status as Assessment['status']
      }));
      
      setAssessments(transformedData as Assessment[]);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = () => {
    setDomains([...domains, { domain: '', rating: 'acquis', comment: '' }]);
  };

  const handleRemoveDomain = (index: number) => {
    setDomains(domains.filter((_, i) => i !== index));
  };

  const handleDomainChange = (index: number, field: keyof AssessmentDomain, value: string) => {
    const updated = [...domains];
    updated[index] = { ...updated[index], [field]: value };
    setDomains(updated);
  };

  const resetForm = () => {
    setSelectedChildId('');
    setPeriodName('Période 1');
    setSchoolYear(getCurrentSchoolYear());
    setDomains(DEFAULT_DOMAINS.map(d => ({ domain: d, rating: 'acquis' as const, comment: '' })));
    setTeacherComment('');
    setEditingAssessment(null);
  };

  const handleSave = async (submitForValidation: boolean = false) => {
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

    setSaving(true);
    try {
      if (!educatorProfileId) {
        toast({
          title: 'Erreur',
          description: 'Profil éducatrice introuvable',
          variant: 'destructive'
        });
        return;
      }

      const assessmentData = {
        child_id: selectedChildId,
        educator_id: educatorProfileId,
        period_name: periodName,
        school_year: schoolYear,
        domains: domains as unknown as any,
        teacher_comment: teacherComment,
        status: submitForValidation ? 'pending' : 'draft',
        assessment_date: format(new Date(), 'yyyy-MM-dd')
      };

      if (editingAssessment) {
        const { error } = await supabase
          .from('periodic_assessments')
          .update(assessmentData)
          .eq('id', editingAssessment.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('periodic_assessments')
          .insert(assessmentData);

        if (error) throw error;
      }

      toast({
        title: 'Succès',
        description: submitForValidation 
          ? 'Bilan envoyé pour validation' 
          : 'Brouillon sauvegardé'
      });

      setShowForm(false);
      resetForm();
      fetchAssessments();
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le bilan',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setSelectedChildId(assessment.child_id);
    setPeriodName(assessment.period_name);
    setSchoolYear(assessment.school_year);
    setDomains(assessment.domains);
    setTeacherComment(assessment.teacher_comment || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('periodic_assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Bilan supprimé' });
      fetchAssessments();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le bilan',
        variant: 'destructive'
      });
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

  const filteredAssessments = assessments.filter(a => {
    if (selectedTab === 'drafts') return a.status === 'draft';
    if (selectedTab === 'pending') return a.status === 'pending';
    if (selectedTab === 'validated') return a.status === 'validated';
    if (selectedTab === 'rejected') return a.status === 'rejected';
    return true;
  });

  const getRatingIcon = (rating: string) => {
    const option = RATING_OPTIONS.find(r => r.value === rating);
    if (!option) return null;
    const Icon = option.icon;
    return <Icon className={`w-5 h-5 ${option.color}`} />;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bilans Périodiques</h1>
          <p className="text-muted-foreground">
            Créez et gérez les bulletins d'évaluation de vos enfants
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau bilan
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="drafts">Brouillons</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
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
                <Card key={assessment.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
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
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(assessment.status)}
                        {(assessment.status === 'draft' || assessment.status === 'rejected') && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(assessment)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(assessment.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {assessment.status === 'rejected' && assessment.rejection_reason && (
                      <div className="mt-3 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                        <strong>Raison du rejet:</strong> {assessment.rejection_reason}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (open) {
            fetchChildren();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingAssessment ? 'Modifier le bilan' : 'Nouveau bilan périodique'}
            </DialogTitle>
            <DialogDescription>
              Remplissez l'évaluation domaine par domaine
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
                      {children.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Aucun enfant assigné
                        </div>
                      ) : (
                        children.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.first_name} {child.last_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {children.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {children.length} enfant(s) assigné(s)
                    </p>
                  )}
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
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder brouillon
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              <Send className="w-4 h-4 mr-2" />
              Envoyer pour validation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EducatorAssessmentsPage;
