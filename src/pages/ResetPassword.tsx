import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      // Log all URL parameters for debugging
      const allParams: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        allParams[key] = value;
      });
      console.log('Reset password URL parameters:', allParams);

      // Check if we have a valid token in the URL
      const type = searchParams.get('type');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const error_code = searchParams.get('error_code');
      const error_description = searchParams.get('error_description');
      
      // Check for errors in URL
      if (error_code || error_description) {
        console.error('Error in URL:', { error_code, error_description });
        setError(`Erreur: ${error_description || 'Lien invalide ou expiré'}`);
        return;
      }

      // Accept 'recovery', 'signup', 'invite', 'magiclink' types, or if we have tokens
      const validTypes = ['recovery', 'signup', 'invite', 'magiclink'];
      if (type && !validTypes.includes(type) && !accessToken && !refreshToken) {
        console.error('Invalid type:', type);
        setError('Lien invalide ou expiré');
        return;
      }

      console.log('Link type:', type);

      // If we have tokens in the URL, try to set the session
      if (accessToken && refreshToken) {
        try {
          console.log('Setting session with tokens...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Session setup error:', error);
            setError('Impossible de valider le lien. Veuillez réessayer.');
          } else {
            console.log('Session established successfully:', data.session?.user?.email);
          }
        } catch (err) {
          console.error('Unexpected session error:', err);
          setError('Erreur lors de la validation du lien.');
        }
      } else {
        console.warn('No tokens found in URL. User may need to click the link from their email.');
        // Check if we already have a session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Aucune session active. Veuillez cliquer sur le lien reçu par email.');
        } else {
          console.log('Existing session found:', session.user.email);
        }
      }
    };

    initializeAuth();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      // First, try to get the current session to ensure we have a valid user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Session invalide. Veuillez cliquer à nouveau sur le lien de confirmation.');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        setError(`Impossible de définir le mot de passe: ${error.message}`);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message,
        });
      } else {
        toast({
          title: "Mot de passe défini",
          description: "Redirection vers votre espace...",
        });
        
        // Get user profile to determine redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        // Redirect based on role after 1 second
        setTimeout(() => {
          if (profile?.role === 'parent') {
            navigate('/parent/dashboard');
          } else if (profile?.role === 'educator') {
            navigate('/educator/dashboard');
          } else {
            navigate('/admin/dashboard');
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="Logo" className="h-16 w-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Définir votre mot de passe</CardTitle>
            <CardDescription>
              Choisissez un mot de passe sécurisé pour votre compte
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
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 6 caractères
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Enregistrement...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Définir le mot de passe</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
