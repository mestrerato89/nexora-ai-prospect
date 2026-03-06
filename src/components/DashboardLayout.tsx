import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search, LogOut, Settings, User as UserIcon, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const initials = user?.email?.charAt(0).toUpperCase() || "U";

  const notifications = [
    { id: 1, title: "Novo lead quente!", description: "Empresa XPTO demonstrou interesse.", time: "2 min atrás", type: "lead" },
    { id: 2, title: "IA: Análise completa", description: "Sua prospecção de ontem foi analisada.", time: "1h atrás", type: "ai" },
    { id: 3, title: "Nova atualização", description: "V1.2.4 já está no ar.", time: "5h atrás", type: "system" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-sidebar-border px-4 lg:px-6 bg-background/50 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="lg:hidden" />
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Explorar inteligência... (Cmd+K)"
                  className="pl-9 w-64 h-9 bg-secondary/50 border-primary/10 text-sm focus:border-primary/40 transition-all font-medium"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors group">
                    <Bell className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 bg-card border-primary/10 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-primary/5 bg-primary/5">
                    <h3 className="font-bold text-sm flex items-center justify-between">
                      Notificações
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Novas: 3</span>
                    </h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-4 border-b border-primary/5 hover:bg-primary/5 cursor-pointer transition-colors group">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{n.title}</p>
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 bg-muted/20 text-center border-t border-primary/5">
                    <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">
                      Ver Tudo
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative group p-0.5 rounded-full border border-primary/10 hover:border-primary/40 transition-all">
                    <Avatar className="h-8 w-8 transition-transform group-hover:scale-95">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-background" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-primary/10 backdrop-blur-xl shadow-2xl">
                  <DropdownMenuLabel className="flex flex-col gap-1 py-3">
                    <span className="text-xs font-bold text-foreground">Minha Conta</span>
                    <span className="text-[10px] text-muted-foreground truncate font-medium">{user?.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-primary/5" />
                  <DropdownMenuItem onClick={() => navigate("/configuracoes")} className="cursor-pointer focus:bg-primary/10 py-2.5">
                    <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Meu Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/configuracoes")} className="cursor-pointer focus:bg-primary/10 py-2.5">
                    <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer focus:bg-primary/10 py-2.5 font-bold text-primary">
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      <span>Painel Admin</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-primary/5" />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:bg-destructive/10 py-2.5 font-medium">
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Encerrar Sessão</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
