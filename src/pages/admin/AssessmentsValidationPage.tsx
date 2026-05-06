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
  Download,
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
import logoImage from '@/assets/logo.png';
import html2pdf from 'html2pdf.js';
import nuage from '@/assets/nuage.png';
import soleil from '@/assets/soleil.png';
import star from '@/assets/star.png';

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

const getSectionAbbreviation = (section?: string): string => {
  if (!section) return '';
  const abbreviations: Record<string, string> = {
    'maternelle_PS1': 'PS',
    'maternelle_PS2': 'PS',
    'maternelle_MS': 'MS',
    'maternelle_GS': 'GS',
    'creche_etoile': 'Crèche',
    'creche_nuage': 'Crèche',
    'creche_soleil': 'TPS',
    'garderie': 'Garderie'
  };
  return abbreviations[section] || '';
};

const convertImageToBase64 = async (imagePath: string): Promise<string> => {
  const response = await fetch(imagePath);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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

  const handleDownloadPDF = async (assessment: Assessment) => {
    let logoBase64 = '';
    let soleilBase64 = '';
    let starBase64 = '';
    let nuageBase64 = '';
    try {
      logoBase64 = await convertImageToBase64(logoImage);
      soleilBase64 = await convertImageToBase64(soleil);
      starBase64 = await convertImageToBase64(star);
      nuageBase64 = await convertImageToBase64(nuage);
    } catch (error) {
      console.error('Error converting logo to base64:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le logo',
        variant: 'destructive'
      });
    }

    const sectionAbbr = getSectionAbbreviation(assessment.child?.section);

    const getPeriodRoman = (periodName: string): string => {
      const match = periodName.match(/\d+/);
      if (!match) return 'I';
      const num = parseInt(match[0]);
      const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V'];
      return romanNumerals[num] || num.toString();
    };

    const periodRoman = getPeriodRoman(assessment.period_name);

    const domainCount = assessment.domains.length;
    const baseFontSize = domainCount > 6 ? 9 : domainCount > 4 ? 10 : 11;
    const rowPadding = domainCount > 6 ? 4 : domainCount > 4 ? 6 : 8;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bilan - ${assessment.child?.first_name} ${assessment.child?.last_name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Nunito:wght@400;600;700&display=swap');
          @page {
            size: A4;
            margin: 8mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Nunito', 'Comic Neue', sans-serif;
            background: #fff8f3;
            color: #333;
            font-size: ${baseFontSize}px;
            line-height: 1.3;
          }
          .page-container {
            width: 100%;
            min-height: 100vh;
            padding: 0;
            background: #fef6e4;
          }
          .header-row {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
          }
          .logo-container {
            width: 70px;
            height: 70px;
          }
          .logo-container img {
            width: 100%;
            height: 100%;
          }
          .header-right {
            text-align: right;
          }
          .year-text {
            font-weight: 700;
            font-size: 12px;
            color: #92400e;
            letter-spacing: 0.5px;
          }

          .title-section {
            text-align: center;
          }
          .title-main {
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
          }
          .child-name {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .dashed-line {
            display: flex;
            justify-content: center;
          }
          .dashed-line span {
            width: 80px;
            height: 0;
            border-bottom: 2px dashed #f59e0b;
          }
          .teacher-section {
            text-align: center;
          }
          .teacher-label {
            font-size: 11px;
            color: #666;
          }
          .teacher-name {
            font-size: 14px;
            font-weight: 700;
            color: #333;
            border-bottom: 2px dashed #f59e0b;
            display: inline-block;
          }
          .sun-decoration {
            display: inline-block;
            font-size: 24px;
          }
          .section-banner {
            background: linear-gradient(135deg, #fcd34d, #f59e0b);
            color: #fff;
            border-radius: 20px;
            width: fit-content;
            font-weight: 700;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
          }
          .clip-icon {
            font-size: 14px;
          }
          .legend-row {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 10px;
            color: #555;
          }
          .legend-icon {
            font-size: 18px;
          }
          .legend-icon-img {
            width: 18px;
            height: 18px;
            object-fit: contain;
          }
          .table-container {
            border: 2px dashed #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: ${rowPadding}px 10px;
          }
          thead {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
          }
          th {
            font-weight: 700;
            color: #92400e;
            font-size: 12px;
            text-align: left;
            border-bottom: 2px dashed #fcd34d;
          }
          th.rating-col,
          td.rating-col {
            text-align: center;
            width: 80px;
          }
          td {
            font-size: ${baseFontSize}px;
            color: #333;
            border-bottom: 1px dashed #e5e7eb;
            vertical-align: middle;
          }
          tr:last-child td {
            border-bottom: 1px solid #e5e7eb;
          }
          .domain-name {
            font-weight: 500;
            width: 28%;
          }
          .comment-text {
            color: #555;
            text-align: justify;
            line-height: 1.35;
          }
          .rating-icon {
            font-size: 22px;
          }
          .rating-icon-img {
            width: 22px;
            height: 22px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
          }
          .teacher-comment-section {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border: 2px dashed #fcd34d;
            border-radius: 12px;
            padding: 10px 15px;
            text-align: center;
          }
          .teacher-comment-title {
            font-weight: 700;
            font-size: 13px;
            color: #92400e;

            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .rocket-icon {
            font-size: 16px;
          }
          .teacher-comment-text {
            color: #444;
            font-style: italic;
            line-height: 1.4;
            font-size: ${baseFontSize}px;
          }
          .clap-icon {
            font-size: 14px;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .page-container {
              padding: 5mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header-row" style="display: flex; flex-direction: row; justify-content: space-between;">
            <div class="logo-container">
              <img src="${logoBase64}" alt="Logo" style="width: 250px; padding: 50px" />
            </div>
            <div class="header-right" style="display: flex; flex-direction: column; padding: 15px 50px 0 0">
              <div class="year-text" style="padding-bottom: 25px">ANNÉE SCOLAIRE : ${assessment.school_year}</div>
              
              <div style="background-color: #fff3e4; padding: 20px 35px 35px 35px;">
                <div>Le bilan de ma Période ${periodRoman}${sectionAbbr ? ` en ${sectionAbbr}` : ''}</div>
                <div class="child-name">${assessment.child?.last_name?.toUpperCase()} ${assessment.child?.first_name}</div>
                <div class="dashed-line"><span></span></div>

                <div class="teacher-section">
                  <div class="teacher-label">Mon institutrice est <span class="teacher-name">Maîtresse ${assessment.educator?.first_name}</span></div>
                </div>

              </div>

            </div>
          </div>


          <div class="section-banner" style="text-align: center; margin: 30px; ">
            <span style="padding: 5px 25px 25px 25px; background-color: #fadb05; border-radius: 10px;">Ce que j'ai appris cette période</span>
          </div>

          <div style="display: flex; flex-direction: row; justify-content: space-around; margin: 50px;">
            <div style="display: flex-direction: column;">

              <div style="display: flex; justify-content: center;">
                <img src="${soleilBase64}" alt="soleil-icon" style="width: 50px; text-align: center;"/>
              </div>

              <div>
                <span><strong>Acquis</strong></span>
              </div>

            </div>

            <div style="display: flex-direction: column;">
            
              <div style="display: flex; justify-content: center;">
                <img src="${starBase64}" alt="star-icon" style="width: 50px;"/>
              </div>

              <div>
                <span><strong>En cours d'acquisition</strong></span>
              </div>

            </div>


            <div style="display: flex-direction: column;">
            
              <div style="display: flex; justify-content: center;">
                <img src="${nuageBase64}" alt="nuage-icon" style="width: 50px;"/>
              </div>

              <div>
                <span><strong>A consolider</strong></span>
              </div>

            </div>

          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr style="text-align:center; border: 1px dashed #1b1f25ff;">
                  <th class="domain-name" style="padding: 5px 10px 20px 10px; border: 1px dashed #1b1f25ff;">Domaines</th>
                  <th class="rating-col" style="padding: 5px 10px 20px 10px; border: 1px dashed #1b1f25ff;">Notation</th>
                  <th style="padding: 5px 10px 20px 10px; border: 1px dashed #1b1f25ff;">Commentaires</th>
                </tr>
              </thead>
              <tbody>
                ${assessment.domains.map(d => {
                  const ratingImg = d.rating === 'acquis' ? soleilBase64 : d.rating === 'en_cours' ? starBase64 : nuageBase64;
                  return `
                  <tr style="border: 1px dashed #1b1f25ff;">
                    <td class="domain-name" style="border: 1px dashed #1b1f25ff; padding: 5px 10px 20px 10px;">${d.domain}</td>
                    <td class="rating-col" style="border: 1px dashed #1b1f25ff; text-align: center;">
                      <img class="rating-icon-img" src="${ratingImg}" alt="${d.rating}" width="30" height="30" style="display: block; margin: 0 auto;"/>
                    </td>
                    <td class="comment-text" style="border: 1px dashed #1b1f25ff; padding: 5px 10px 20px 10px;">${d.comment || '—'}</td>
                  </tr>
                `;
                }).join('')}
              </tbody>
            </table>
          </div>

          ${assessment.teacher_comment ? `
            <div class="teacher-comment-section">
              <div class="teacher-comment-title">
                <span>Petit mot de la maîtresse</span>
                <span class="rocket-icon">🚀</span>
              </div>
              <div class="teacher-comment-text">
                ${assessment.teacher_comment} <span class="clap-icon">👏</span>
              </div>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    try {
      toast({
        title: 'Génération du PDF',
        description: 'Le PDF est en cours de génération...'
      });

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm';
      tempContainer.style.height = '297mm';
      tempContainer.style.overflow = 'hidden';
      document.body.appendChild(tempContainer);

      const iframe = document.createElement('iframe');
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      tempContainer.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Could not access iframe document');
      }

      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for content to load'));
        }, 10000);

        const checkReady = () => {
          try {
            const body = iframeDoc.body;
            if (!body) {
              setTimeout(checkReady, 100);
              return;
            }

            const images = body.querySelectorAll('img');
            let loadedImages = 0;
            const totalImages = images.length;

            if (totalImages === 0) {
              clearTimeout(timeout);
              resolve();
              return;
            }

            const imageLoadHandler = () => {
              loadedImages++;
              if (loadedImages === totalImages) {
                clearTimeout(timeout);
                resolve();
              }
            };

            const imageErrorHandler = () => {
              loadedImages++;
              if (loadedImages === totalImages) {
                clearTimeout(timeout);
                resolve();
              }
            };

            images.forEach((img) => {
              if (img.complete) {
                loadedImages++;
              } else {
                img.addEventListener('load', imageLoadHandler, { once: true });
                img.addEventListener('error', imageErrorHandler, { once: true });
              }
            });

            if (loadedImages === totalImages) {
              clearTimeout(timeout);
              resolve();
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        };

        iframe.onload = () => {
          setTimeout(checkReady, 500);
        };

        if (iframeDoc.readyState === 'complete') {
          setTimeout(checkReady, 500);
        } else {
          iframeDoc.addEventListener('DOMContentLoaded', checkReady, { once: true });
        }
      });

      const bodyElement = iframeDoc.body;
      if (!bodyElement) {
        throw new Error('Could not access body element');
      }

      const margin: [number, number, number, number] = [8, 8, 8, 8];
      const filename = `Bilan_${assessment.child?.first_name}_${assessment.child?.last_name}_${assessment.period_name}.pdf`;

      const opt = {
        margin,
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          letterRendering: true,
          windowWidth: 794,
          windowHeight: 1123,
          backgroundColor: '#fef6e4',
          removeContainer: true,
          onclone: (clonedDoc: Document) => {
            const clonedBody = clonedDoc.body;
            if (clonedBody) {
              clonedBody.style.backgroundColor = '#fef6e4';
            }
          }
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const,
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt as any).from(bodyElement).save();

      try {
        document.body.removeChild(tempContainer);
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }

      toast({
        title: 'Succès',
        description: 'Le PDF a été téléchargé avec succès.'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);

      try {
        const containers = document.querySelectorAll('div[style*="-9999px"]');
        containers.forEach(container => {
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
        });
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }

      toast({
        title: 'Erreur',
        description: error instanceof Error
          ? `Impossible de générer le PDF: ${error.message}`
          : 'Impossible de générer le PDF. Veuillez réessayer.',
        variant: 'destructive'
      });
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

      try {
        const assessment = assessments.find(a => a.id === id);
        const childId = assessment?.child_id;
        if (childId) {
          await supabase.functions.invoke('send-whatsapp-notification', {
            body: {
              notification_type: 'periodic_assessment_available',
              child_id: childId,
              entity_table: 'periodic_assessments',
              entity_id: id,
              deep_link_path: '/parent/dashboard/assessments'
            }
          });
        }
      } catch (whatsAppError) {
        console.error('Error sending WhatsApp notification:', whatsAppError);
        // Ne pas faire échouer toute l'opération si WhatsApp échoue
      }

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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(assessment)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger pdf
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
