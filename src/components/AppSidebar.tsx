import {
  LayoutDashboard,
  Smartphone,
  Globe,
  FolderOpen,
  Sparkles,
  Search as SearchIcon,
  Crosshair,
  Users,
  Mail,
  Bot,
  FileText,
  BookOpen,
  LifeBuoy,
  Settings,
  Moon,
  Sun,
  LogOut,
  Calendar,
  ShieldCheck,
  DollarSign,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [leadCount, setLeadCount] = useState(0);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);

  // Fetch initial count and listen for new leads (status 'novo')
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'novo');
      if (!error) setLeadCount(count || 0);
    };
    fetchCount();

    const channel = supabase
      .channel('public:leads')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads'
      }, (payload) => {
        const newLead = payload.new;
        if (newLead && newLead.status === 'novo') {
          setLeadCount((prev) => prev + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchOtherCounts = async () => {
      const [fuRes, projRes] = await Promise.all([
        supabase.from("follow_ups").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", false),
        supabase.from("projects" as any).select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setFollowUpCount(fuRes.count || 0);
      setProjectCount(projRes.count || 0);
    };
    fetchOtherCounts();
  }, [user]);

  const principalItems: MenuItem[] = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Projetos Salvos", url: "/projetos-salvos", icon: FolderOpen, badge: projectCount > 0 ? projectCount.toString() : undefined },
    { title: "Evoluir Projetos", url: "/evoluir-projetos", icon: Sparkles },
    { title: "Prospector de Serviços", url: "/prospector-servicos", icon: SearchIcon, badge: "Pro", badgeColor: "bg-warning/20 text-warning" },
  ];

  const growthItems: MenuItem[] = [
    { title: "Prospecção", url: "/prospeccao", icon: Crosshair },
    { title: "CRM Prospecção", url: "/leads", icon: Users, badge: leadCount > 0 ? leadCount.toString() : undefined, badgeColor: "bg-primary/20 text-primary" },
    { title: "E-mail Marketing", url: "/email-marketing", icon: Mail },
    { title: "Assistente", url: "/assistente", icon: Bot, badge: "IA", badgeColor: "bg-[hsl(var(--badge-new))]/20 text-[hsl(var(--badge-new))]" },
    { title: "Contratos", url: "/contratos", icon: FileText },
    { title: "Agenda", url: "/agenda", icon: Calendar, badge: followUpCount > 0 ? followUpCount.toString() : undefined, badgeColor: "bg-destructive/20 text-destructive" },
  ];

  const suporteItems: MenuItem[] = [
    { title: "Área de Estudos", url: "/area-de-estudos", icon: BookOpen },
    { title: "Suporte", url: "/suporte", icon: LifeBuoy },
    { title: "Configurações", url: "/configuracoes", icon: Settings },
  ];

  const adminItems: MenuItem[] = [
    { title: "Painel Admin", url: "/admin", icon: ShieldCheck },
    { title: "Gestão Financeira", url: "/financeiro", icon: DollarSign },
  ];

  const renderMenuItems = (items: MenuItem[]) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
            activeClassName="bg-sidebar-accent text-primary border-l-[3px] border-primary font-medium"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.title}</span>}
            {!collapsed && item.badge && (
              <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded ${item.badgeColor || "bg-warning/20 text-warning"}`}>
                {item.badge}
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-primary">
              <path d="M7 21L14 7L21 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 16H18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="14" cy="7" r="2" fill="currentColor" />
              <circle cx="7" cy="21" r="2" fill="currentColor" />
              <circle cx="21" cy="21" r="2" fill="currentColor" />
            </svg>
          </div>
          {!collapsed && (
            <div>
              <span className="text-base font-mono font-bold tracking-tight text-foreground">Rataria</span>
              <p className="text-[9px] font-mono tracking-[0.35em] text-muted-foreground uppercase">AI</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mt-4 space-y-2">
            <Button size="sm" className="w-full justify-center text-[10px] font-mono font-bold uppercase tracking-widest rounded-button" onClick={() => navigate("/novo-app")}>
              <Smartphone className="h-3.5 w-3.5 mr-1.5" /> Novo App
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-center text-[10px] font-mono font-medium border-border rounded-button uppercase tracking-widest" onClick={() => navigate("/novo-site")}>
              <Globe className="h-3.5 w-3.5 mr-1.5" /> Novo Site
            </Button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground px-3 mb-1">Principal</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderMenuItems(principalItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground px-3 mb-1">Growth</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderMenuItems(growthItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1">Administração</SidebarGroupLabel>
            <SidebarGroupContent><SidebarMenu>{renderMenuItems(adminItems)}</SidebarMenu></SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1">Suporte</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderMenuItems(suporteItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-1">
        <Separator className="mb-2 bg-sidebar-border" />
        <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{theme === "dark" ? "Tema Claro" : "Tema Escuro"}</span>}
        </button>
        <button onClick={signOut} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-sidebar-accent transition-colors w-full">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
