import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Printer, QrCode, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Child {
  id: string;
  code_qr_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  section?: string;
}

interface QRCodeGeneratorProps {
  child: Child;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function QRCodeGenerator({ child, isOpen, onOpenChange }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && child.code_qr_id) {
      generateQRCode();
    }
  }, [isOpen, child.code_qr_id]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Générer un QR code sans informations personnelles
      // Encodage minimal: préfixe + identifiant opaque
      const qrData = `LPRDS-${child.code_qr_id}`;

      const url = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      setQrCodeUrl(url);
    } catch (error) {
      console.error('Erreur génération QR:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le QR code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = async () => {
    if (!qrCodeUrl) return;

    try {
      // Créer un canvas pour le template d'impression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dimensions du template
      canvas.width = 600;
      canvas.height = 800;

      // Fond blanc
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bordure
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Titre
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Code QR - Identification Enfant', canvas.width / 2, 70);

      // Nom de l'enfant
      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`${child.first_name} ${child.last_name}`, canvas.width / 2, 120);

      // Code QR ID
      ctx.font = '18px Arial';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Code: ${child.code_qr_id}`, canvas.width / 2, 150);

      // Section si disponible
      if (child.section) {
        const sectionLabels = {
          'creche': 'Crèche (3-12 mois)',
          'garderie': 'Garderie (3-8 ans)',
          'maternelle_etoile': 'Maternelle Étoile (12-24 mois)',
          'maternelle_soleil': 'Maternelle Soleil (24-36 mois)'
        };
        const sectionLabel = sectionLabels[child.section as keyof typeof sectionLabels] || child.section;
        ctx.fillText(`Section: ${sectionLabel}`, canvas.width / 2, 180);
      }

      // Charger et dessiner le QR code
      const qrImage = new Image();
      qrImage.onload = () => {
        // Dessiner le QR code centré
        const qrSize = 300;
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = 220;
        
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

        // Instructions
        ctx.font = '16px Arial';
        ctx.fillStyle = '#475569';
        ctx.fillText('Scanner ce code pour identifier l\'enfant', canvas.width / 2, 580);
        ctx.fillText('lors des arrivées et départs', canvas.width / 2, 605);

        // Date de génération
        ctx.font = '14px Arial';
        ctx.fillStyle = '#94a3b8';
        const now = new Date().toLocaleDateString('fr-FR');
        ctx.fillText(`Généré le ${now}`, canvas.width / 2, 750);

        // Télécharger l'image
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `QR_${child.first_name}_${child.last_name}_${child.code_qr_id}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
              title: "Succès",
              description: "QR code téléchargé avec succès",
            });
          }
        }, 'image/png', 1.0);
      };

      qrImage.src = qrCodeUrl;
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le QR code",
        variant: "destructive",
      });
    }
  };

  const printQRCode = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${child.first_name} ${child.last_name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .print-container {
              max-width: 600px;
              margin: 0 auto;
              text-align: center;
              border: 2px solid #e2e8f0;
              padding: 30px;
              border-radius: 8px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 10px;
            }
            .child-name {
              font-size: 32px;
              font-weight: bold;
              color: #0f172a;
              margin: 20px 0;
            }
            .code {
              font-size: 18px;
              color: #64748b;
              margin-bottom: 10px;
            }
            .section {
              font-size: 16px;
              color: #64748b;
              margin-bottom: 30px;
            }
            .qr-code {
              margin: 30px 0;
            }
            .instructions {
              font-size: 16px;
              color: #475569;
              margin: 20px 0;
            }
            .date {
              font-size: 14px;
              color: #94a3b8;
              margin-top: 30px;
            }
            @media print {
              body { margin: 0; }
              .print-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="title">Code QR - Identification Enfant</div>
            <div class="child-name">${child.first_name} ${child.last_name}</div>
            <div class="code">Code: ${child.code_qr_id}</div>
            ${child.section ? `<div class="section">Section: ${child.section}</div>` : ''}
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="QR Code" style="width: 300px; height: 300px;" />
            </div>
            <div class="instructions">
              Scanner ce code pour identifier l'enfant<br>
              lors des arrivées et départs
            </div>
            <div class="date">Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Générateur QR Code - {child.first_name} {child.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aperçu du QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Aperçu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Génération en cours...</span>
                </div>
              ) : qrCodeUrl ? (
                <div className="text-center space-y-4">
                  <div className="inline-block p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Nom:</strong> {child.first_name} {child.last_name}</p>
                    <p><strong>Code:</strong> {child.code_qr_id}</p>
                    {child.section && (
                      <p><strong>Section:</strong> {child.section}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  Aucun QR code généré
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template d'impression (caché) */}
          <div ref={printRef} className="hidden">
            <div className="print-template bg-white p-8 border-2 border-gray-200 rounded-lg text-center max-w-md mx-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Code QR - Identification Enfant</h2>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{child.first_name} {child.last_name}</h3>
              <p className="text-gray-600 mb-4">Code: {child.code_qr_id}</p>
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 mx-auto mb-4" />
              )}
              <p className="text-sm text-gray-500">Scanner ce code pour identifier l'enfant</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={downloadQRCode}
              disabled={!qrCodeUrl}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Télécharger PNG
            </Button>
            
            <Button
              onClick={printQRCode}
              disabled={!qrCodeUrl}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export également un composant bouton pour déclencher le générateur
export function QRCodeGeneratorTrigger({ child }: { child: Child }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1"
      >
        <QrCode className="w-4 h-4" />
        QR Code
      </Button>
      
      <QRCodeGenerator
        child={child}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}