import { PermissionGuard } from '@/components/PermissionGuard';
import QRScanner from '@/components/admin/QRScanner';

const QRScanPage = () => {
  return (
    <PermissionGuard 
      permission="attendance.manage_all"
      fallback={
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Accès non autorisé</h2>
          <p className="text-muted-foreground">
            Seuls les administrateurs et secrétaires peuvent accéder au scanner QR.
          </p>
        </div>
      }
    >
      <QRScanner />
    </PermissionGuard>
  );
};

export default QRScanPage;