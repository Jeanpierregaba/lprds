import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Baby, Calendar, Download, Image as ImageIcon, Play, Trash2, Upload } from 'lucide-react';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  section?: string;
}

interface GalleryMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  reportId: string;
  reportDate: string;
  child: Child;
}

const AdminGalleryPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [media, setMedia] = useState<GalleryMedia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [uploadChildId, setUploadChildId] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [deletingSelection, setDeletingSelection] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadChildren();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (children.length > 0) {
      loadMedia();
    } else {
      setLoading(false);
    }
  }, [children, selectedChildId, dateFrom, dateTo]);

  const loadChildren = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('children')
        .select('id, first_name, last_name, photo_url, section')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;

      const childrenData: Child[] = (data || []).map((child: any) => ({
        id: child.id,
        first_name: child.first_name,
        last_name: child.last_name,
        photo_url: child.photo_url,
        section: child.section,
      }));

      setChildren(childrenData);

      if (childrenData.length > 0) {
        setSelectedChildId('all');
      }
    } catch (error) {
      console.error('Erreur chargement enfants (galerie admin):', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste des enfants pour la galerie',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMedia = async () => {
    try {
      setLoading(true);

      const childIds = children.map((c) => c.id);
      if (childIds.length === 0) {
        setMedia([]);
        return;
      }

      let query = supabase
        .from('daily_reports')
        .select(
          `id, report_date, photos, child:children!child_id ( id, first_name, last_name, photo_url, section )`
        )
        .in('child_id', childIds)
        .eq('is_validated', true)
        .order('report_date', { ascending: false });

      if (selectedChildId !== 'all') {
        query = query.eq('child_id', selectedChildId);
      }
      if (dateFrom) {
        query = query.gte('report_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('report_date', dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      const items: GalleryMedia[] = [];

      (data || []).forEach((report: any) => {
        if (Array.isArray(report.photos) && report.photos.length > 0) {
          report.photos.forEach((url: string, index: number) => {
            if (!url) return;
            const cleanUrl = typeof url === 'string' ? url : String(url);
            const isVideo = /\.(mp4|mov|avi|webm|mkv)$/i.test(cleanUrl.split('?')[0]);

            items.push({
              id: `${report.id}-${index}`,
              url: cleanUrl,
              type: isVideo ? 'video' : 'image',
              reportId: report.id,
              reportDate: report.report_date,
              child: {
                id: report.child?.id,
                first_name: report.child?.first_name,
                last_name: report.child?.last_name,
                photo_url: report.child?.photo_url,
                section: report.child?.section,
              },
            });
          });
        }
      });

      setMedia(items);
    } catch (error) {
      console.error('Erreur chargement médias (galerie admin):', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les médias de la galerie',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        toast({
          title: 'Format non supporté',
          description: `Le fichier ${file.name} n'est ni une image ni une vidéo`,
          variant: 'destructive',
        });
        return false;
      }

      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      const maxSizeLabel = isVideo ? '50MB' : '10MB';

      if (file.size > maxSize) {
        toast({
          title: 'Fichier trop volumineux',
          description: `Le fichier ${file.name} dépasse ${maxSizeLabel}`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      setUploadFiles((prev) => [...prev, ...validFiles]);
    }

    event.target.value = '';
  };

  const handleUploadSubmit = async () => {
    if (!uploadChildId || !uploadDate || uploadFiles.length === 0) {
      toast({
        title: 'Champs manquants',
        description: 'Sélectionnez un enfant, une date et au moins un fichier.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);

      const { data: report, error: reportError } = await supabase
        .from('daily_reports')
        .select('id, photos')
        .eq('child_id', uploadChildId)
        .eq('report_date', uploadDate)
        .maybeSingle();

      if (reportError) throw reportError;

      if (!report) {
        toast({
          title: 'Aucun rapport trouvé',
          description:
            "Aucun rapport quotidien n'existe pour cet enfant à cette date. Créez d'abord un rapport avant d'y ajouter des médias.",
          variant: 'destructive',
        });
        return;
      }

      const uploadedUrls: string[] = [];

      for (const file of uploadFiles) {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${report.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('daily-reports')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('Erreur upload média (galerie admin):', uploadError);
            throw uploadError;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from('daily-reports').getPublicUrl(fileName);

          uploadedUrls.push(publicUrl);
        } catch (error: any) {
          console.error('Erreur upload média (galerie admin) détaillée:', error);
          toast({
            title: "Erreur upload",
            description: `Impossible d'uploader le fichier ${file.name}`,
            variant: 'destructive',
          });
        }
      }

      if (uploadedUrls.length > 0) {
        const existingMedia: string[] = Array.isArray(report.photos) ? (report.photos as string[]) : [];
        const allMedia = Array.from(new Set([...existingMedia, ...uploadedUrls]));

        const { error: updateError } = await supabase
          .from('daily_reports')
          .update({ photos: allMedia })
          .eq('id', report.id);

        if (updateError) throw updateError;

        toast({
          title: 'Médias ajoutés',
          description: 'Les médias ont été ajoutés au rapport et seront visibles pour les parents.',
        });

        setUploadFiles([]);
        setUploadDate('');
        await loadMedia();
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de médias à un rapport:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'ajouter les médias au rapport",
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getStoragePathFromPublicUrl = (publicUrl: string) => {
    const marker = '/storage/v1/object/public/daily-reports/';
    const [, pathWithQuery = ''] = publicUrl.split(marker);
    return decodeURIComponent(pathWithQuery.split('?')[0] || '');
  };

  const handleDeleteMedia = async (item: GalleryMedia) => {
    const confirmDelete = window.confirm(
      'Voulez-vous vraiment supprimer ce média ? Cette action est irréversible.'
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingMediaId(item.id);

      const { data: report, error: reportError } = await supabase
        .from('daily_reports')
        .select('photos')
        .eq('id', item.reportId)
        .single();

      if (reportError) throw reportError;

      const currentPhotos: string[] = Array.isArray(report?.photos) ? (report.photos as string[]) : [];
      const updatedPhotos = currentPhotos.filter((url) => url !== item.url);

      const { error: updateError } = await supabase
        .from('daily_reports')
        .update({ photos: updatedPhotos })
        .eq('id', item.reportId);

      if (updateError) throw updateError;

      const storagePath = getStoragePathFromPublicUrl(item.url);
      if (storagePath) {
        const { error: storageDeleteError } = await supabase.storage
          .from('daily-reports')
          .remove([storagePath]);

        if (storageDeleteError) {
          console.warn('Média retiré du rapport mais non supprimé du stockage:', storageDeleteError);
        }
      }

      setMedia((prev) => prev.filter((mediaItem) => mediaItem.id !== item.id));
      setSelectedMediaIds((prev) => prev.filter((selectedId) => selectedId !== item.id));

      toast({
        title: 'Média supprimé',
        description: 'Le média a été supprimé de la galerie.',
      });
    } catch (error) {
      console.error('Erreur suppression média (galerie admin):', error);
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer ce média pour le moment.",
        variant: 'destructive',
      });
    } finally {
      setDeletingMediaId(null);
    }
  };

  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredMedia.map((item) => item.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedMediaIds.includes(id));

    if (allVisibleSelected) {
      setSelectedMediaIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedMediaIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleDeleteSelectedMedia = async () => {
    const selectedItems = media.filter((item) => selectedMediaIds.includes(item.id));

    if (selectedItems.length === 0) {
      toast({
        title: 'Aucun média sélectionné',
        description: 'Sélectionnez au moins un média pour lancer la suppression.',
        variant: 'destructive',
      });
      return;
    }

    const confirmDelete = window.confirm(
      `Voulez-vous vraiment supprimer ${selectedItems.length} média${selectedItems.length > 1 ? 's' : ''} ? Cette action est irréversible.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingSelection(true);

      const mediaByReportId = selectedItems.reduce<Record<string, string[]>>((acc, item) => {
        if (!acc[item.reportId]) {
          acc[item.reportId] = [];
        }
        acc[item.reportId].push(item.url);
        return acc;
      }, {});

      for (const [reportId, urlsToDelete] of Object.entries(mediaByReportId)) {
        const { data: report, error: reportError } = await supabase
          .from('daily_reports')
          .select('photos')
          .eq('id', reportId)
          .single();

        if (reportError) throw reportError;

        const currentPhotos: string[] = Array.isArray(report?.photos) ? (report.photos as string[]) : [];
        const updatedPhotos = currentPhotos.filter((url) => !urlsToDelete.includes(url));

        const { error: updateError } = await supabase
          .from('daily_reports')
          .update({ photos: updatedPhotos })
          .eq('id', reportId);

        if (updateError) throw updateError;
      }

      const storagePaths = selectedItems
        .map((item) => getStoragePathFromPublicUrl(item.url))
        .filter(Boolean);

      if (storagePaths.length > 0) {
        const { error: storageDeleteError } = await supabase.storage
          .from('daily-reports')
          .remove(storagePaths);

        if (storageDeleteError) {
          console.warn('Médias retirés des rapports mais non supprimés du stockage:', storageDeleteError);
        }
      }

      setMedia((prev) => prev.filter((item) => !selectedMediaIds.includes(item.id)));
      setSelectedMediaIds([]);

      toast({
        title: 'Suppression terminée',
        description: `${selectedItems.length} média${selectedItems.length > 1 ? 's ont été supprimés' : ' a été supprimé'}.`,
      });
    } catch (error) {
      console.error('Erreur suppression multiple médias (galerie admin):', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer les médias sélectionnés.',
        variant: 'destructive',
      });
    } finally {
      setDeletingSelection(false);
    }
  };

  const sanitizeFileNamePart = (value: string) => {
    return value
      .trim()
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 60);
  };

  const getImageFileExtension = (url: string, mimeType: string) => {
    const fromUrl = url.split('?')[0].split('.').pop()?.toLowerCase();
    if (fromUrl && /^[a-z0-9]+$/.test(fromUrl)) {
      return fromUrl;
    }

    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    if (mimeType === 'image/gif') return 'gif';
    return 'jpg';
  };

  const handleExportImagesZip = async () => {
    const imagesToExport = filteredMedia.filter((item) => item.type === 'image');

    if (imagesToExport.length === 0) {
      toast({
        title: 'Aucune image à exporter',
        description: 'Aucune image ne correspond aux filtres actuels.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setExportingZip(true);
      setExportProgress({ done: 0, total: imagesToExport.length });
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      const imagesByChild = imagesToExport.reduce<Record<string, GalleryMedia[]>>((acc, item) => {
        if (!acc[item.child.id]) {
          acc[item.child.id] = [];
        }
        acc[item.child.id].push(item);
        return acc;
      }, {});

      let successCount = 0;
      let errorCount = 0;

      for (const childImages of Object.values(imagesByChild)) {
        if (childImages.length === 0) continue;

        const child = childImages[0].child;
        const childFolderName = sanitizeFileNamePart(`${child.first_name}_${child.last_name}`) || child.id;
        const childFolder = zip.folder(childFolderName);

        if (!childFolder) {
          continue;
        }

        const usedNames = new Set<string>();

        for (let index = 0; index < childImages.length; index += 1) {
          const item = childImages[index];

          try {
            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), 15000);
            const response = await fetch(item.url, { signal: controller.signal });
            window.clearTimeout(timeoutId);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const fileBlob = await response.blob();
            const extension = getImageFileExtension(item.url, fileBlob.type);
            const datePrefix = item.reportDate ? item.reportDate.split('-').join('') : 'sans_date';
            const baseName = `${datePrefix}_${String(index + 1).padStart(3, '0')}.${extension}`;

            let finalName = baseName;
            let duplicateCounter = 1;
            while (usedNames.has(finalName)) {
              finalName = `${datePrefix}_${String(index + 1).padStart(3, '0')}_${duplicateCounter}.${extension}`;
              duplicateCounter += 1;
            }

            usedNames.add(finalName);
            childFolder.file(finalName, fileBlob);
            successCount += 1;
          } catch (error) {
            console.warn("Erreur lors du téléchargement d'une image pour export ZIP:", item.url, error);
            errorCount += 1;
          } finally {
            setExportProgress((prev) =>
              prev ? { ...prev, done: Math.min(prev.done + 1, prev.total) } : prev
            );
          }
        }
      }

      if (successCount === 0) {
        throw new Error('Aucune image exportable');
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `galerie_images_${stamp}.zip`;

      const downloadUrl = URL.createObjectURL(zipBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(downloadUrl);

      toast({
        title: 'Export terminé',
        description: `${successCount} image${successCount > 1 ? 's exportées' : ' exportée'} au format ZIP.`,
      });

      if (errorCount > 0) {
        toast({
          title: 'Export partiel',
          description: `${errorCount} image${errorCount > 1 ? 's' : ''} n'ont pas pu être ajoutées au ZIP.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur export ZIP galerie admin:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de générer l'archive ZIP pour le moment.",
        variant: 'destructive',
      });
    } finally {
      setExportingZip(false);
      setExportProgress(null);
    }
  };

  const filteredMedia = useMemo(() => {
    return media;
  }, [media]);

  useEffect(() => {
    const availableIds = new Set(media.map((item) => item.id));
    setSelectedMediaIds((prev) => prev.filter((id) => availableIds.has(id)));
  }, [media]);

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-primary text-3xl font-bold flex items-center gap-2">
            <ImageIcon className="h-7 w-7" />
            Galerie - Administration
          </h1>
          <p className="text-primary">
            Visualisez tous les médias envoyés aux parents et ajoutez-en de nouveaux aux rapports quotidiens.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filtres & Upload */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>Affinez les médias affichés dans la galerie.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-muted-foreground">Enfant</label>
                <select
                  className="w-full border rounded-md px-2 py-1 text-sm bg-background"
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                >
                  <option value="all">Tous les enfants</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-muted-foreground">Date depuis</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-muted-foreground">Date jusqu&apos;à</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {(dateFrom || dateTo) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                >
                  Réinitialiser les dates
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Envoyer des médias aux parents</CardTitle>
              <CardDescription>
                Ajoutez des photos ou vidéos à un rapport quotidien existant pour les rendre visibles aux parents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-muted-foreground">Enfant</label>
                <select
                  className="w-full border rounded-md px-2 py-1 text-sm bg-background"
                  value={uploadChildId}
                  onChange={(e) => setUploadChildId(e.target.value)}
                >
                  <option value="">Sélectionner un enfant</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-muted-foreground">Date du rapport</label>
                <Input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted-foreground">Fichiers</label>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleUploadFiles}
                  className="text-xs"
                />
                {uploadFiles.length > 0 && (
                  <Textarea
                    readOnly
                    className="text-xs h-20 resize-none"
                    value={uploadFiles.map((f) => `• ${f.name}`).join('\n')}
                  />
                )}
                <p className="text-[11px] text-muted-foreground">
                  Images (max 10MB) • Vidéos (max 50MB)
                </p>
              </div>

              <Button
                className="w-full flex items-center gap-2"
                size="sm"
                onClick={handleUploadSubmit}
                disabled={uploading}
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Envoi en cours...' : 'Ajouter aux rapports'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Grille médias */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Médias envoyés
                </CardTitle>
                {filteredMedia.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleExportImagesZip}
                      disabled={exportingZip || filteredMedia.every((item) => item.type !== 'image')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {exportingZip
                        ? `Export ZIP... ${
                            exportProgress ? `${exportProgress.done}/${exportProgress.total}` : ''
                          }`
                        : 'Exporter ZIP'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAllVisible}
                    >
                      {filteredMedia.every((item) => selectedMediaIds.includes(item.id))
                        ? 'Tout désélectionner'
                        : 'Tout sélectionner'}
                    </Button>
                    {selectedMediaIds.length > 0 && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMediaIds([])}
                        >
                          Effacer la sélection
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteSelectedMedia}
                          disabled={deletingSelection}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {deletingSelection
                            ? 'Suppression...'
                            : `Supprimer (${selectedMediaIds.length})`}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <CardDescription>
                {filteredMedia.length === 0
                  ? "Aucun média trouvé pour les filtres sélectionnés."
                  : `${filteredMedia.length} média${filteredMedia.length > 1 ? 's' : ''} trouvés`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-muted-foreground">
                  Chargement de la galerie...
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  Aucun média n'a encore été chargé dans la galerie.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredMedia.map((item) => {
                    const dateLabel = new Date(item.reportDate).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                    const isSelected = selectedMediaIds.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`group relative rounded-lg overflow-hidden border bg-card hover:shadow-md transition cursor-pointer ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => window.open(item.url, '_blank')}
                      >
                        <div
                          className="absolute top-2 left-2 z-20"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary cursor-pointer"
                            checked={isSelected}
                            onChange={() => toggleMediaSelection(item.id)}
                            aria-label="Sélectionner le média"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 z-20 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={deletingMediaId === item.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteMedia(item);
                          }}
                          aria-label="Supprimer le média"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="relative w-full h-32 sm:h-36 bg-muted">
                          {item.type === 'video' ? (
                            <>
                              <video
                                src={item.url}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 text-xs text-white">
                                  <Play className="h-3 w-3" />
                                  <span>Vidéo</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <img
                              src={item.url}
                              alt="Média de la journée"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="px-2 py-2 space-y-1">
                          <div className="text-xs font-medium truncate flex items-center gap-1">
                            <Baby className="h-3 w-3 text-muted-foreground" />
                            <span>{item.child.first_name} {item.child.last_name}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                            <span>{dateLabel}</span>
                            {item.child.section && (
                              <Badge variant="outline" className="text-[9px]">
                                {item.child.section}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminGalleryPage;
