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
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { markAllAsRead, markAsRead as markSingleAsRead } from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const initials = user?.email?.charAt(0).toUpperCase() || "U";
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data || []);
      setUnreadCount(data?.filter((n: any) => !n.read).length || 0);
    }
  };

  useEffect(() => {
    const cleanupOldNotifications = async () => {
      if (!user) return;
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      await (supabase as any)
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', threeDaysAgo.toISOString());
    };

    cleanupOldNotifications();
    fetchNotifications();

    if (!user) return;
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast(payload.new.title, {
          description: payload.new.description,
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllAsRead(user.id);
    fetchNotifications();
  };

  const handleMarkRead = async (id: string) => {
    await markSingleAsRead(id);
    fetchNotifications();
  };

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
                    <Bell className={`h-4 w-4 transition-colors ${unreadCount > 0 ? 'text-primary animate-bounce' : 'text-muted-foreground group-hover:text-primary'}`} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 bg-card border-primary/10 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-primary/5 bg-primary/5 flex items-center justify-between">
                    <h3 className="font-bold text-sm tracking-tight">
                      Notificações
                    </h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shrink-0 animate-pulse">Novas: {unreadCount}</span>
                      )}
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-12 px-8 text-center">
                        <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-xs text-muted-foreground italic">Nenhuma notificação por aqui.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className={`p-4 border-b border-primary/5 hover:bg-primary/5 cursor-pointer transition-colors group relative ${!n.read ? 'bg-primary/[0.02]' : 'opacity-70'}`}
                        >
                          {!n.read && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                          <div className="flex justify-between items-start mb-1 gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm shrink-0">
                                {n.type === 'lead' ? '🎯' : n.type === 'payment' ? '💰' : n.type === 'follow_up' ? '📅' : '🔔'}
                              </span>
                              <p className={`text-xs font-bold transition-colors ${!n.read ? 'text-foreground group-hover:text-primary' : 'text-muted-foreground'}`}>
                                {n.title}
                              </p>
                            </div>
                            <span className="text-[9px] text-muted-foreground whitespace-nowrap mt-0.5">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed font-medium">{n.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 bg-muted/20 text-center border-t border-primary/5">
                    <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest py-1.5 block w-full">
                      Ver Histórico Completo
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
