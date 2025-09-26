import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Calendar, AlertTriangle, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: string;
  expiryDate?: string;
  category: string;
}

interface DocumentUploadProps {
  childId: string;
  documents: Document[];
  onDocumentUploaded: () => void;
}

export default function DocumentUpload({ childId, documents, onDocumentUploaded }: DocumentUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentCategories = [
    { value: 'medical_certificate', label: '📋 Certificat Médical', color: 'destructive' },
    { value: 'identity', label: '🆔 Pièce d\'Identité', color: 'primary' },
    { value: 'health_record', label: '📖 Carnet de Santé', color: 'accent' },
    { value: 'vaccination', label: '💉 Carnet de Vaccination', color: 'secondary' },
    { value: 'insurance', label: '🛡️ Assurance', color: 'default' },
    { value: 'authorization', label: '📝 Autorisation', color: 'outline' },
    { value: 'other', label: '📄 Autre', color: 'outline' }
  ];

  const handleFileUpload = async (file: File, category: string, expiryDate?: string) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Validate file
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Le fichier est trop volumineux (max 10MB)');
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Type de fichier non autorisé. Utilisez PDF, JPG ou PNG.');
      }

      // Generate unique filename
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${childId}/${category}/${timestamp}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('daily-reports') // Using existing bucket
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('daily-reports')
        .getPublicUrl(fileName);

      // Save document info to database (you might need to create a documents table)
      const documentData = {
        child_id: childId,
        name: file.name,
        type: file.type,
        url: publicUrl,
        size: file.size,
        category: category,
        expiry_date: expiryDate || null,
        uploaded_at: new Date().toISOString()
      };

      // For now, we'll save to the administrative_documents JSON field
      const { data: childData, error: fetchError } = await supabase
        .from('children')
        .select('administrative_documents')
        .eq('id', childId)
        .single();

      if (fetchError) throw fetchError;

      const existingDocs = Array.isArray(childData.administrative_documents) ? childData.administrative_documents : [];
      const updatedDocs = [...existingDocs, { ...documentData, id: crypto.randomUUID() }];

      const { error: updateError } = await supabase
        .from('children')
        .update({ administrative_documents: updatedDocs })
        .eq('id', childId);

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: "Document téléchargé avec succès",
      });

      onDocumentUploaded();
      setIsDialogOpen(false);
      
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du téléchargement",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (expiry < today) {
      return { status: 'expired', label: 'Expiré', color: 'destructive' };
    } else if (expiry < thirtyDaysFromNow) {
      return { status: 'expiring', label: 'Expire bientôt', color: 'secondary' };
    }
    return { status: 'valid', label: 'Valide', color: 'default' };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documents Administratifs</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Télécharger Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Télécharger un Document</DialogTitle>
            </DialogHeader>
            <UploadForm 
              onUpload={handleFileUpload}
              uploading={uploading}
              uploadProgress={uploadProgress}
              categories={documentCategories}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents by Category */}
      <div className="grid gap-6">
        {documentCategories.map((category) => {
          const categoryDocs = documents.filter(doc => doc.category === category.value);
          
          return (
            <Card key={category.value}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {category.label}
                  <Badge variant="outline" className="text-xs">
                    {categoryDocs.length} document{categoryDocs.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryDocs.length > 0 ? (
                  <div className="space-y-3">
                    {categoryDocs.map((doc) => {
                      const expiryStatus = getExpiryStatus(doc.expiryDate);
                      
                      return (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatFileSize(doc.size)}</span>
                                <span>•</span>
                                <span>{new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</span>
                                {doc.expiryDate && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(doc.expiryDate).toLocaleDateString('fr-FR')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {expiryStatus && (
                              <Badge variant={expiryStatus.color as any} className="text-xs">
                                {expiryStatus.status === 'expired' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                {expiryStatus.label}
                              </Badge>
                            )}
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Aucun document dans cette catégorie
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Formulaire d'upload
function UploadForm({ 
  onUpload, 
  uploading, 
  uploadProgress, 
  categories 
}: {
  onUpload: (file: File, category: string, expiryDate?: string) => Promise<void>;
  uploading: boolean;
  uploadProgress: number;
  categories: any[];
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [requiresExpiry, setRequiresExpiry] = useState(false);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setRequiresExpiry(['medical_certificate', 'insurance', 'authorization'].includes(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile && category) {
      onUpload(selectedFile, category, expiryDate || undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="category">Catégorie de document *</Label>
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="file">Fichier *</Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          disabled={uploading}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Formats acceptés: PDF, JPG, PNG (max 10MB)
        </p>
      </div>

      {requiresExpiry && (
        <div>
          <Label htmlFor="expiry">Date d'expiration</Label>
          <Input
            id="expiry"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-muted-foreground text-center">
            Téléchargement en cours... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={!selectedFile || !category || uploading} className="flex-1">
          {uploading ? 'Téléchargement...' : 'Télécharger'}
        </Button>
      </div>
    </form>
  );
}