import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Printer, QrCode, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import patternBg from '@/assets/pattern-bg.png';
import logo from '@/assets/logo.png';

// Fonctions d'encodage/décodage pour sécuriser le QR code
const ENCRYPTION_KEY = 'LPRDS_SECURE_KEY_2024'; // Clé de chiffrement

const encodeChildId = (childId: string): string => {
  try {
    // Créer un payload avec timestamp pour éviter les collisions
    const timestamp = Date.now().toString(36);
    const payload = `${childId}:${timestamp}`;
    
    // Chiffrement XOR simple mais efficace
    let encrypted = '';
    for (let i = 0; i < payload.length; i++) {
      const charCode = payload.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      encrypted += String.fromCharCode(charCode);
    }
    
    // Encoder en Base64 pour éviter les caractères problématiques
    return btoa(encrypted);
  } catch (error) {
    console.error('Erreur encodage:', error);
    return childId; // Fallback vers l'ID original
  }
};

const decodeChildId = (encodedData: string): string | null => {
  try {
    // Décoder Base64
    const encrypted = atob(encodedData);
    
    // Déchiffrement XOR
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(charCode);
    }
    
    // Extraire l'ID enfant (avant le ':')
    const [childId] = decrypted.split(':');
    return childId;
  } catch (error) {
    console.error('Erreur décodage:', error);
    return null;
  }
};

interface Child {
  id: string;
  code_qr_id: string;
  first_name: string;
  last_name: string;
  usual_name?: string;
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
      // Générer un QR code sécurisé avec l'ID enfant encodé
      const encodedChildId = encodeChildId(child.id);
      const qrData = `LPRDS:${encodedChildId}`;

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

  // Fonction pour diviser le texte en plusieurs lignes si nécessaire
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const downloadQRCode = async () => {
    if (!qrCodeUrl) return;

    try {
      // Créer un canvas pour le template d'impression
      const encodedChildId = encodeChildId(child.id);

      // Charger et enregistrer la police MuseoSansRounded pour le canvas
      try {
        // Utilise un poids moyen par défaut; adapter si besoin
        const museoFont = new FontFace('MuseoSansRounded', 'url(/fonts/Museo/MuseoSansRounded500.woff)');
        await museoFont.load();
        (document as any).fonts && document.fonts.add(museoFont);
      } catch (e) {
        console.warn('Impossible de charger la police MuseoSansRounded, fallback appliqué.');
      }
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dimensions du template
      canvas.width = 1004;
      canvas.height = 650;

      // Fond blanc
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Utilitaire pour charger une image
      const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

      // Charger le motif de fond et le QR
      const [bgImg] = await Promise.all([
        loadImage(patternBg)
      ]);

      // Dessiner le motif en mode cover avec opacité 40%
      ctx.save();
      ctx.globalAlpha = 0.2;
      {
        const scale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
        const drawW = Math.round(bgImg.width * scale);
        const drawH = Math.round(bgImg.height * scale);
        const drawX = Math.round((canvas.width - drawW) / 2);
        const drawY = Math.round((canvas.height - drawH) / 2);
        ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
      }
      ctx.restore();

      // Bordure
      ctx.strokeStyle = '#00a099';
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Logo en-tête
      const logoImg = await loadImage(logo);
      const logoMaxWidth = 175;
      const logoScale = Math.min(logoMaxWidth / logoImg.width, 1);
      const logoW = Math.round(logoImg.width * logoScale);
      const logoH = Math.round(logoImg.height * logoScale);
      const logoX = (canvas.width - logoW) / 2;
      const logoY = 50;
      ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);

          
      // Titre
      ctx.fillStyle = '#164f2b';
      ctx.font = 'bold 36px MuseoSansRounded, Poppins, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Code QR - Identification Enfant', canvas.width / 2, logoY + logoH  + 50);

      // Nom de l'enfant avec gestion du retour à la ligne
      ctx.font = 'bold 50px Fredoka One, Poppins, Arial';
      ctx.fillStyle = '#f4a92b';
        const fullName = `${child.usual_name || child.first_name} ${child.last_name}`;
      const maxWidth = canvas.width - 100; // Marge de 50px de chaque côté
      const nameLines = wrapText(ctx, fullName, maxWidth);
      
      // Dessiner chaque ligne du nom
      const lineHeight = 50; // Espacement entre les lignes
      const startY = logoY + logoH + 120;
      nameLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
      });


      // Section si disponible
      if (child.section) {
        const sectionLabels: Record<string, string> = {
          'creche_etoile': 'Crèche Étoile (3-18 mois)',
          'creche_nuage': 'Crèche Nuage (18-24 mois)',
          'creche_soleil': 'Crèche Soleil TPS (24-36 mois)',
          'garderie': 'Garderie (3-8 ans)',
          'maternelle_PS1': 'Maternelle Petite Section 1',
          'maternelle_PS2': 'Maternelle Petite Section 2',
          'maternelle_MS': 'Maternelle Moyenne Section'
        };
        const sectionLabel = sectionLabels[child.section as keyof typeof sectionLabels] || child.section;
        ctx.font = 'bold 20px MuseoSansRounded, Poppins, Arial';
        ctx.fillStyle = '#00a099';
        // Ajuster la position de la section en fonction du nombre de lignes du nom
        const sectionY = startY + (nameLines.length * lineHeight);
        ctx.fillText(`Section: ${sectionLabel}`, canvas.width / 2, sectionY);
      }

      // Charger et dessiner le QR code
      const qrImg = await loadImage(qrCodeUrl);
      // Dessiner le QR code centré
      const qrSize = 210;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 350;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);



      // Date de génération
      ctx.font = '14px MuseoSansRounded, Poppins, Arial';
      ctx.fillStyle = '#164f2b';
      ctx.fillText('www.lespetitsrayonsdesoleil.fr', canvas.width / 2, 600);

      // Télécharger l'image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `QR_${child.first_name}_${child.last_name}_${encodedChildId.slice(0, 8)}.png`;
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
            <div class="logo">
              <img src="${logo}" style="width: 100px;" />
            </div>
            <div class="title">Code QR - Identification Enfant</div>
            <div class="child-name">${child.first_name} ${child.last_name}</div>
            <div class="code">Code: ${encodeChildId(child.id).slice(0, 8)}...</div>
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
                    <p><strong>Code sécurisé:</strong> {encodeChildId(child.id).slice(0, 12)}...</p>
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
              <p className="text-gray-600 mb-4">Code: {encodeChildId(child.id).slice(0, 8)}...</p>
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