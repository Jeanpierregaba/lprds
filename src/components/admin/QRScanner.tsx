import React, { useState, useEffect } from 'react';
import BarcodeScanner from 'react-qr-barcode-scanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { usePermissions } from '@/hooks/usePermissions';
import { parseQRCodeData } from '@/lib/qrDecoder';

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
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraErrorNotified, setCameraErrorNotified] = useState(false);
  const [personName, setPersonName] = useState('');
  const [temperature, setTemperature] = useState('');
  const { toast } = useToast();
  const { profile } = useAuth();
  const { isStaff } = usePermissions();

  // Capture une référence temporelle unique pour éviter des divergences entre date/heure
  const getNowParts = () => {
    const now = new Date();
    return {
      now,
      isoString: now.toISOString(),
      dateISO: now.toISOString().slice(0, 10),   // yyyy-mm-dd
      time: now.toTimeString().slice(0, 8),      // HH:MM:SS (local)
      epochMs: now.getTime()
    };
  };
  // Demander l'accès caméra proactivement (sur action utilisateur)
  const requestCameraAccess = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Libérer immédiatement, le composant BarcodeScanner rouvrira le flux
      stream.getTracks().forEach((t) => t.stop());
      setHasCameraPermission(true);
      setIsScanning(true);
    } catch (err: any) {
      setHasCameraPermission(false);
      if (!cameraErrorNotified) {
        toast({
          title: "Accès caméra refusé",
          description: err?.name === 'NotAllowedError' 
            ? "Veuillez autoriser l'accès à la caméra dans votre navigateur."
            : err?.name === 'NotFoundError'
              ? "Aucune caméra détectée sur cet appareil."
              : "Impossible d'accéder à la caméra.",
          variant: "destructive"
        });
        setCameraErrorNotified(true);
      }
    }
  };


  // Fonction pour valider et traiter le QR code
  const processQRCode = async (qrCode: string): Promise<ScanResult> => {
    try {
      // Nouveau format sécurisé: LPRDS:<encoded>
      if (qrCode.startsWith('LPRDS:')) {
        const { childId, isValid } = parseQRCodeData(qrCode);
        if (!isValid || !childId) {
          return {
            success: false,
            message: 'QR Code invalide - Données illisibles'
          };
        }
        // Rechercher par ID décodé
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
          .eq('id', childId)
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

        const suggestedAction = !lastScan || lastScan.scan_type === 'departure' ? 'arrival' : 'departure';

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
      }

      // Ancien format: supporter JSON et LPRDS-<token>
      let normalizedCode = qrCode;
      try {
        const parsed = JSON.parse(qrCode);
        if (parsed && (parsed.code || parsed.code_qr_id)) {
          const token = String(parsed.code || parsed.code_qr_id)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 5);
          normalizedCode = `LPRDS-${token}`;
        }
      } catch (_) {
        // not JSON, keep as-is
      }

      if (!normalizedCode.startsWith('LPRDS-')) {
        return {
          success: false,
          message: 'QR Code invalide - Format non reconnu'
        };
      }

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
        .eq('code_qr_id', normalizedCode.replace('LPRDS-', ''))
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

    // Validation
    if (!personName.trim()) {
      toast({
        title: "Champ requis",
        description: "Veuillez renseigner la personne qui " + (scanType === 'arrival' ? 'amène' : 'récupère') + " l'enfant",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { isoString, dateISO, time } = getNowParts();

      // Enregistrer dans qr_scan_logs
      const { error: scanError } = await supabase
        .from('qr_scan_logs')
        .insert({
          child_id: childId,
          scan_type: scanType,
          scanned_by: profile.id,
          scan_time: isoString
        });

      if (scanError) throw scanError;

      // Mettre à jour ou créer l'enregistrement de présence du jour
      const today = dateISO;
      
      const { data: existingAttendance } = await supabase
        .from('daily_attendance')
        .select('id')
        .eq('child_id', childId)
        .eq('attendance_date', today)
        .maybeSingle();

      const tempValue = temperature ? parseFloat(temperature) : null;

      if (existingAttendance) {
        // Mettre à jour l'enregistrement existant
        const updateData = scanType === 'arrival' 
          ? { 
              arrival_time: time,
              arrival_scanned_by: profile.id,
              is_present: true,
              brought_by: personName,
              arrival_temperature: tempValue
            }
          : { 
              departure_time: time,
              departure_scanned_by: profile.id,
              picked_up_by: personName,
              departure_temperature: tempValue
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
            arrival_time: time,
            arrival_scanned_by: profile.id,
            is_present: true,
            brought_by: personName,
            arrival_temperature: tempValue
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
      setPersonName('');
      setTemperature('');
      
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
    // Le composant peut remonter des erreurs transitoires fréquemment.
    if (!error) return;
    // Ne notifier qu'une fois pour les erreurs critiques
    if (!cameraErrorNotified && (error.name === 'NotAllowedError' || error.name === 'NotFoundError')) {
      console.error('Erreur caméra:', error);
      toast({
        title: "Erreur caméra",
        description: error.name === 'NotAllowedError'
          ? "Accès refusé. Autorisez la caméra dans les paramètres du site."
          : "Aucune caméra disponible.",
        variant: "destructive"
      });
      setCameraErrorNotified(true);
      setIsScanning(false);
    }
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
    setPersonName('');
    setTemperature('');
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
          {/* Protection d'accès: visible uniquement pour le personnel */}
          {!isStaff() && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Accès refusé. Cette fonctionnalité est réservée au personnel.</AlertDescription>
            </Alert>
          )}

          {isStaff() && (
            <>
          
          {/* Contrôles caméra */}
          <div className="flex gap-3">
            <Button
              onClick={() => (isScanning ? setIsScanning(false) : requestCameraAccess())}
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

          {/* Avertissement contexte non sécurisé */}
          {!window.isSecureContext && window.location.hostname !== 'localhost' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Le scan nécessite HTTPS. Ouvrez le site en https:// ou utilisez localhost.
              </AlertDescription>
            </Alert>
          )}

          {/* Scanner caméra */}
          {isScanning && (
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto border-4 border-primary rounded-lg overflow-hidden bg-black">
                <BarcodeScanner
                  onUpdate={(err, result) => {
                    const text = (result as any)?.text ?? (result as any)?.getText?.();
                    if (text) {
                      handleScan(text as string);
                    }
                    if (err) {
                      handleError(err);
                    }
                  }}
                  width={500}
                  height={500}
                  facingMode={facingMode}
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
                      <Badge variant="outline">{`LPRDS-${(scannedChild.code_qr_id || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0,5)}`}</Badge>
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

                {/* Formulaire de pointage */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="personName">
                      Personne qui {scanResult?.suggested_action === 'arrival' ? 'amène' : 'récupère'} l'enfant *
                    </Label>
                    <Input
                      id="personName"
                      placeholder="Nom et prénom"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature">
                      Température (°C)
                    </Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="34"
                      max="42"
                      placeholder="37.5"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                {/* Bouton d'action unique selon le contexte */}
                <Button
                  onClick={() => recordAttendance(scannedChild.id, scanResult?.suggested_action || 'arrival')}
                  disabled={isProcessing}
                  variant="default"
                  className="h-12 w-full"
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Enregistrer {scanResult?.suggested_action === 'arrival' ? "l'arrivée" : 'le départ'}
                </Button>
                
              </CardContent>
            </Card>
          )}

          </>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;