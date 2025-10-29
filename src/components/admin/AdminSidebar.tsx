import { LogOut, User } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useRoleBasedNavigation } from "@/components/RoleBasedNavigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"

export function AdminSidebar() {
  const { state } = useSidebar()
  const { profile, signOut } = useAuth()
  const { toast } = useToast()
  const location = useLocation()
  const currentPath = location.pathname
  const menuItems = useRoleBasedNavigation()

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return currentPath === path
    }
    return currentPath.startsWith(path)
  }

  const handleSignOut = async () => {
    await signOut()
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès."
    })
  }

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <User className="size-4" />
          </div>
          {state === "expanded" && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Administration</span>
              <span className="truncate text-xs text-muted-foreground">
                {profile?.role === 'admin' ? 'Direction' : 
                 profile?.role === 'secretary' ? 'Secrétariat' : 
                 profile?.role === 'educator' ? 'Éducateur' : 'Utilisateur'}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url, item.exact)}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="flex items-center gap-2 px-2 py-2">
          {state === "expanded" && (
            <div className="flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {profile?.first_name}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs capitalize">
                  {profile?.role}
                </Badge>
              </div>
            </div>
          )}
          <Button 
            variant="ghost" 
            size={state === "expanded" ? "sm" : "icon"}
            onClick={handleSignOut}
            className="ml-auto"
          >
            <LogOut className="size-4" />
            {state === "expanded" && <span className="ml-2">Déconnexion</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}