import { useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import dashboardBg from '@/assets/dashboard-bg.png'

const EducatorDashboardLayout = () => {
  const { user, profile, loading } = useAuth()
  const { isEducator } = usePermissions()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div 
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${dashboardBg})`,
          }}
        />
        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <p className="text-lg font-semibold">Chargement de votre espace...</p>
              <p className="text-sm text-muted-foreground">Vérification de vos accès</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div 
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${dashboardBg})`,
          }}
        />
        <Card>
          <CardHeader>
            <CardTitle>Accès non autorisé</CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder à cette page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!profile.is_active) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div 
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${dashboardBg})`,
          }}
        />
        <Card>
          <CardHeader>
            <CardTitle>Compte désactivé</CardTitle>
            <CardDescription>
              Votre compte a été désactivé. Contactez l'administration pour plus d'informations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Check if user is an educator
  if (!isEducator()) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div 
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${dashboardBg})`,
          }}
        />
        <Card>
          <CardHeader>
            <CardTitle>Accès non autorisé</CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              Seuls les éducateurs peuvent accéder à cette section.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        <div 
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${dashboardBg})`,
          }}
        />
        <AdminSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Espace Éducateur</span>
              <span className="text-muted-foreground">
                {profile.first_name} {profile.last_name}
              </span>
            </div>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default EducatorDashboardLayout
