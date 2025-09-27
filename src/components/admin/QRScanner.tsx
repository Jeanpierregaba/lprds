import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Camera, 
  CameraOff, 
  SwitchCamera, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ScannedChild {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  code_qr_id: string;
  section?: string;
  group_name?: string;
  last_attendance?: {
    scan_type: 'arrival' | 'departure';
    scan_time: string;
  };
}

interface ScanResult {
  success: boolean;
  message: string;
  child?: ScannedChild;
  suggested_action?: 'arrival' | 'departure';
}

const QRScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [scannedChild, setScannedChild] = useState<ScannedChild | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Fonction pour valider et traiter le QR code
  const processQRCode = async (qrCode: string): Promise<ScanResult> => {
    try {
      // Valider le format du QR code (doit commencer par LPRDS-)
      if (!qrCode.startsWith('LPRDS-')) {
        return {
          success: false,
          message: 'QR Code invalide - Format non reconnu'
        };
      }

      // Rechercher l'enfant dans la base de données
      const { data: child, error } = await supabase
        .from('children')
        .select(`
          id,
          first_name,
          last_name,
          photo_url,
          code_qr_id,
          section,
          groups (
            name
          )
        `)
        .eq('code_qr_id', qrCode)
        .eq('status', 'active')
        .maybeSingle();

      if (error || !child) {
        return {
          success: false,
          message: 'Enfant non trouvé ou inactif'
        };
      }

      // Vérifier les derniers pointages
      const { data: lastScan } = await supabase
        .from('qr_scan_logs')
        .select('scan_type, scan_time')
        .eq('child_id', child.id)
        .order('scan_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Déterminer l'action suggérée
      const suggestedAction = !lastScan || lastScan.scan_type === 'departure' ? 'arrival' : 'departure';

      // Vérifier le double pointage (même type < 5min)
      if (lastScan) {
        const lastScanTime = new Date(lastScan.scan_time);
        const timeDiff = Date.now() - lastScanTime.getTime();
        const minutesDiff = timeDiff / (1000 * 60);

        if (minutesDiff < 5) {
          return {
            success: false,
            message: `Dernière action il y a ${Math.round(minutesDiff)} minutes. Attendez au moins 5 minutes entre les pointages.`
          };
        }
      }

      return {
        success: true,
        message: 'QR Code valide',
        child: {
          ...child,
          group_name: child.groups?.name,
          last_attendance: lastScan ? {
            scan_type: lastScan.scan_type as 'arrival' | 'departure',
            scan_time: lastScan.scan_time
          } : undefined
        },
        suggested_action: suggestedAction
      };

    } catch (error) {
      console.error('Erreur lors du traitement du QR:', error);
      return {
        success: false,
        message: 'Erreur lors de la validation du QR Code'
      };
    }
  };

  // Fonction pour enregistrer le pointage
  const recordAttendance = async (childId: string, scanType: 'arrival' | 'departure') => {
    if (!profile) return;

    setIsProcessing(true);
    
    try {
      // Enregistrer dans qr_scan_logs
      const { error: scanError } = await supabase
        .from('qr_scan_logs')
        .insert({
          child_id: childId,
          scan_type: scanType,
          scanned_by: profile.id,
          scan_time: new Date().toISOString()
        });

      if (scanError) throw scanError;

      // Mettre à jour ou créer l'enregistrement de présence du jour
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingAttendance } = await supabase
        .from('daily_attendance')
        .select('id')
        .eq('child_id', childId)
        .eq('attendance_date', today)
        .maybeSingle();

      if (existingAttendance) {
        // Mettre à jour l'enregistrement existant
        const updateData = scanType === 'arrival' 
          ? { 
              arrival_time: new Date().toTimeString().split(' ')[0],
              arrival_scanned_by: profile.id,
              is_present: true
            }
          : { 
              departure_time: new Date().toTimeString().split(' ')[0],
              departure_scanned_by: profile.id
            };

        const { error: updateError } = await supabase
          .from('daily_attendance')
          .update(updateData)
          .eq('id', existingAttendance.id);

        if (updateError) throw updateError;
      } else if (scanType === 'arrival') {
        // Créer un nouvel enregistrement pour l'arrivée
        const { error: insertError } = await supabase
          .from('daily_attendance')
          .insert({
            child_id: childId,
            educator_id: profile.id,
            attendance_date: today,
            arrival_time: new Date().toTimeString().split(' ')[0],
            arrival_scanned_by: profile.id,
            is_present: true
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Pointage enregistré",
        description: `${scanType === 'arrival' ? 'Arrivée' : 'Départ'} enregistré${scanType === 'arrival' ? 'e' : ''} avec succès`,
      });

      // Reset après succès
      setScannedChild(null);
      setScanResult(null);
      
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le pointage",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Gestionnaire de scan
  const handleScan = async (data: string | null) => {
    if (!data || scannedChild || isProcessing) return;

    const result = await processQRCode(data);
    setScanResult(result);
    
    if (result.success && result.child) {
      setScannedChild(result.child);
      setIsScanning(false);
    } else {
      toast({
        title: "Scan échoué",
        description: result.message,
        variant: "destructive"
      });
      
      // Auto-reset après erreur
      setTimeout(() => {
        setScanResult(null);
      }, 3000);
    }
  };

  // Gestionnaire d'erreur
  const handleError = (error: any) => {
    console.error('Erreur caméra:', error);
    toast({
      title: "Erreur caméra",
      description: "Impossible d'accéder à la caméra",
      variant: "destructive"
    });
  };

  // Switch caméra
  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  // Reset scanner
  const resetScanner = () => {
    setScannedChild(null);
    setScanResult(null);
    setIsScanning(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Scanner QR - Gestion des Présences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Contrôles caméra */}
          <div className="flex gap-3">
            <Button
              onClick={() => setIsScanning(!isScanning)}
              variant={isScanning ? "destructive" : "default"}
              className="flex-1"
            >
              {isScanning ? (
                <>
                  <CameraOff className="h-4 w-4 mr-2" />
                  Arrêter le scan
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Commencer le scan
                </>
              )}
            </Button>
            
            {isScanning && (
              <Button
                onClick={switchCamera}
                variant="outline"
                size="icon"
              >
                <SwitchCamera className="h-4 w-4" />
              </Button>
            )}
            
            {(scannedChild || scanResult) && (
              <Button
                onClick={resetScanner}
                variant="outline"
              >
                Nouveau scan
              </Button>
            )}
          </div>

          {/* Scanner caméra */}
          {isScanning && (
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto border-4 border-primary rounded-lg overflow-hidden bg-black">
                <QrReader
                  onResult={(result) => {
                    if (result) {
                      handleScan(result.getText());
                    }
                  }}
                  constraints={{
                    facingMode: facingMode
                  }}
                  containerStyle={{
                    width: '100%',
                    height: '100%'
                  }}
                />
              </div>
              <div className="absolute inset-0 border-4 border-dashed border-primary/50 rounded-lg pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-48 h-48 border-4 border-primary rounded-lg"></div>
                </div>
              </div>
            </div>
          )}

          {/* Résultat d'erreur */}
          {scanResult && !scanResult.success && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{scanResult.message}</AlertDescription>
            </Alert>
          )}

          {/* Informations enfant scanné */}
          {scannedChild && (
            <Card className="border-2 border-primary animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={scannedChild.photo_url} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xl font-bold">
                      {scannedChild.first_name} {scannedChild.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline">{scannedChild.code_qr_id}</Badge>
                      {scannedChild.section && (
                        <Badge>{scannedChild.section}</Badge>
                      )}
                      {scannedChild.group_name && (
                        <span className="text-xs">{scannedChild.group_name}</span>
                      )}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Dernier pointage */}
                {scannedChild.last_attendance && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-1">Dernier pointage:</div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <Badge variant={scannedChild.last_attendance.scan_type === 'arrival' ? 'default' : 'secondary'}>
                        {scannedChild.last_attendance.scan_type === 'arrival' ? 'Arrivée' : 'Départ'}
                      </Badge>
                      <span>{new Date(scannedChild.last_attendance.scan_time).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                )}

                {/* Action suggérée */}
                {scanResult?.suggested_action && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Action suggérée: <strong>
                        {scanResult.suggested_action === 'arrival' ? 'Arrivée' : 'Départ'}
                      </strong>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Boutons d'action */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => recordAttendance(scannedChild.id, 'arrival')}
                    disabled={isProcessing}
                    variant={scanResult?.suggested_action === 'arrival' ? 'default' : 'outline'}
                    className="h-12"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Arrivée
                  </Button>
                  
                  <Button
                    onClick={() => recordAttendance(scannedChild.id, 'departure')}
                    disabled={isProcessing}
                    variant={scanResult?.suggested_action === 'departure' ? 'default' : 'outline'}
                    className="h-12"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Départ
                  </Button>
                </div>
                
              </CardContent>
            </Card>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;