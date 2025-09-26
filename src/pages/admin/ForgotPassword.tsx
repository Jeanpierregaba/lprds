import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError('Impossible d\'envoyer l\'email de récupération');
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Vérifiez votre adresse email et réessayez.",
        });
      } else {
        setSent(true);
        toast({
          title: "Email envoyé",
          description: "Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.",
        });
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={logo} alt="Logo" className="h-16 w-auto" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Email envoyé !</CardTitle>
              <CardDescription>
                Nous avons envoyé un lien de récupération à votre adresse email
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <p className="text-sm text-muted-foreground">
                Vérifiez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe.
              </p>
              
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la connexion
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="Logo" className="h-16 w-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
            <CardDescription>
              Entrez votre adresse email pour recevoir un lien de récupération
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Envoi en cours...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Envoyer le lien</span>
                </div>
              )}
            </Button>
            
            <div className="text-center">
              <Link
                to="/admin/login"
                className="text-sm text-primary hover:underline inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour à la connexion
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;