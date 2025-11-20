import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Baby, Calendar, Image as ImageIcon, Play, Upload } from 'lucide-react';

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

  const filteredMedia = useMemo(() => {
    return media;
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
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Médias envoyés
              </CardTitle>
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

                    return (
                      <div
                        key={item.id}
                        className="group rounded-lg overflow-hidden border bg-card hover:shadow-md transition cursor-pointer"
                        onClick={() => window.open(item.url, '_blank')}
                      >
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
