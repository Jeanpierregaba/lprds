import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Baby, Calendar, Image as ImageIcon, Play } from 'lucide-react';

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

const ParentGalleryPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [media, setMedia] = useState<GalleryMedia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (profile?.id) {
      loadChildren();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (children.length > 0 && profile?.id) {
      loadMedia(children);
    } else if (!profile?.id) {
      setLoading(false);
    }
  }, [children, profile?.id]);

  const loadChildren = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('children')
        .select(`
          id,
          first_name,
          last_name,
          photo_url,
          section,
          parent_children!inner(parent_id)
        `)
        .eq('parent_children.parent_id', profile!.id)
        .eq('status', 'active');

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
      console.error('Erreur chargement enfants (galerie parent):', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos enfants pour la galerie',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMedia = async (childrenList: Child[]) => {
    try {
      setLoading(true);

      const childIds = childrenList.map((c) => c.id);
      if (childIds.length === 0) {
        setMedia([]);
        return;
      }

      const { data, error } = await supabase
        .from('daily_reports')
        .select(
          `id, report_date, photos, child:children!child_id ( id, first_name, last_name, photo_url, section )`
        )
        .in('child_id', childIds)
        .eq('is_validated', true)
        .order('report_date', { ascending: false });

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
      console.error('Erreur chargement médias (galerie parent):', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les médias de la galerie',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = useMemo(() => {
    if (selectedChildId === 'all') return media;
    return media.filter((item) => item.child.id === selectedChildId);
  }, [media, selectedChildId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-primary text-3xl font-bold flex items-center gap-2">
            <ImageIcon className="h-7 w-7" />
            Galerie Photos & Vidéos
          </h1>
          <p className="text-primary">
            Retrouvez les souvenirs envoyés via les rapports quotidiens
          </p>
        </div>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center space-y-2">
            <Baby className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucun enfant actif trouvé dans votre compte. Les médias seront visibles ici lorsqu'au moins un enfant sera associé.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filtres enfants */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mes enfants</CardTitle>
                <CardDescription>Sélectionnez un enfant pour filtrer la galerie.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant={selectedChildId === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedChildId('all')}
                >
                  Tous les enfants
                </Button>
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant={selectedChildId === child.id ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => setSelectedChildId(child.id)}
                  >
                    <span>{child.first_name} {child.last_name}</span>
                    {child.section && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        {child.section}
                      </Badge>
                    )}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Grille médias */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Médias reçus
                </CardTitle>
                <CardDescription>
                  {filteredMedia.length === 0
                    ? "Aucun média disponible pour les filtres sélectionnés."
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
                    Aucun média n'a encore été partagé via les rapports quotidiens.
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
                            <div className="text-xs font-medium truncate">
                              {item.child.first_name} {item.child.last_name}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                              <span>{dateLabel}</span>
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
      )}
    </div>
  );
};

export default ParentGalleryPage;
