// Exemple d'utilisation du décodeur QR pour scanner
import { parseQRCodeData, validateQRCode } from '@/lib/qrDecoder';

// Exemple de fonction de scan QR
export const handleQRScan = async (scannedData: string) => {
  try {
    // Valider le format du QR code
    if (!validateQRCode(scannedData)) {
      throw new Error('QR code invalide ou corrompu');
    }
    
    // Parser et décoder les données
    const { childId, isValid } = parseQRCodeData(scannedData);
    
    if (!isValid || !childId) {
      throw new Error('Impossible de décoder l\'ID enfant');
    }
    
    // Maintenant vous pouvez utiliser childId pour récupérer les données de l'enfant
    console.log('ID enfant décodé:', childId);
    
    // Exemple d'utilisation avec Supabase
    // const { data: child, error } = await supabase
    //   .from('children')
    //   .select('*')
    //   .eq('id', childId)
    //   .single();
    
    return childId;
  } catch (error) {
    console.error('Erreur lors du scan:', error);
    throw error;
  }
};

// Exemple d'utilisation dans un composant React
export const QRScannerExample = () => {
  const handleScan = (data: string) => {
    try {
      const childId = handleQRScan(data);
      console.log('Enfant identifié:', childId);
      // Traiter l'identification de l'enfant...
    } catch (error) {
      console.error('Erreur scan:', error);
      // Afficher une erreur à l'utilisateur
    }
  };
  
  return (
    <div>
      {/* Votre composant de scanner QR ici */}
      <p>Scanner QR code sécurisé...</p>
    </div>
  );
};
