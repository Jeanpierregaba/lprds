import { Calendar, Baby, MessageSquare, FileText, LayoutDashboard, LogOut, UtensilsCrossed, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';

const parentSections = [
  { key: 'overview', icon: LayoutDashboard, label: "Vue d'ensemble" },
  { key: 'children', icon: Baby, label: 'Mes Enfants' },
  { key: 'attendance', icon: Calendar, label: 'Présences' },
  //{ key: 'gallery', icon: ImageIcon, label: 'Galerie' },
  { key: 'menus', icon: UtensilsCrossed, label: 'Menus' },
  { key: 'reports', icon: FileText, label: 'Rapports' },
  { key: 'messages', icon: MessageSquare, label: 'Messages' },
];

interface ParentSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function ParentSidebar({ activeView, setActiveView }: ParentSidebarProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  // Handler de déconnexion
  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès."
    });
    window.location.href = '/';
  };
  return (
    <Sidebar collapsible="icon" className="border-r bg-background">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Baby className="size-4" />
          </div>
          {state === 'expanded' && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Espace Parent</span>
              <span className="truncate text-xs text-muted-foreground">Parent</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {parentSections.map((section) => (
                <SidebarMenuItem key={section.key}>
                  <SidebarMenuButton
                    asChild={false}
                    isActive={activeView === section.key}
                    onClick={() => {
                      setActiveView(section.key);
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                  >
                    <section.icon className="size-4" />
                    <span>{section.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="flex flex-col items-stretch gap-2 px-2 py-2">
          {state === 'expanded' && (
            <div className="flex-1 text-left text-sm leading-tight mb-2">
              <span className="truncate font-medium">{profile?.first_name}</span>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs capitalize">Parent</Badge>
              </div>
            </div>
          )}
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full flex justify-start"
          >
            <LogOut className="size-4 mr-2" />
            {state === 'expanded' && <span>Déconnexion</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
