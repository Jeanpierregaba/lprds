// Utilitaires de décodage QR pour le scanner
// Ce fichier contient les fonctions nécessaires pour décoder les QR codes sécurisés

const ENCRYPTION_KEY = 'LPRDS_SECURE_KEY_2024'; // Clé de chiffrement (doit correspondre à celle du générateur)

export const decodeChildId = (encodedData: string): string | null => {
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

export const parseQRCodeData = (qrData: string): { childId: string | null; isValid: boolean } => {
  try {
    // Vérifier le format LPRDS:encodedData
    if (!qrData.startsWith('LPRDS:')) {
      return { childId: null, isValid: false };
    }
    
    const encodedData = qrData.substring(6); // Enlever le préfixe "LPRDS:"
    const childId = decodeChildId(encodedData);
    
    return {
      childId,
      isValid: childId !== null
    };
  } catch (error) {
    console.error('Erreur parsing QR:', error);
    return { childId: null, isValid: false };
  }
};

// Fonction de validation pour vérifier qu'un QR code est valide
export const validateQRCode = (qrData: string): boolean => {
  const { isValid } = parseQRCodeData(qrData);
  return isValid;
};
