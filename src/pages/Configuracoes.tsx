import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings, User, Building, LogOut, Bell, Shield, CreditCard, Link as LinkIcon, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function Configuracoes() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      display_name: profile.display_name,
      phone: profile.phone,
      company_name: profile.company_name,
      company_cnpj: profile.company_cnpj,
      notification_preferences: (profile as any).notification_preferences,
    } as any).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Configurações salvas!");
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Configurações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas informações e preferências da conta</p>
        </div>

        <Tabs defaultValue="perfil">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="perfil" className="gap-2 text-xs"><User className="h-3.5 w-3.5" /> Perfil</TabsTrigger>
            <TabsTrigger value="empresa" className="gap-2 text-xs"><Building className="h-3.5 w-3.5" /> Empresa</TabsTrigger>
            <TabsTrigger value="notificacoes" className="gap-2 text-xs"><Bell className="h-3.5 w-3.5" /> Notificações</TabsTrigger>
            <TabsTrigger value="seguranca" className="gap-2 text-xs"><Shield className="h-3.5 w-3.5" /> Segurança</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="mt-4">
            <div className="bg-card rounded-xl border border-primary/10 p-6 space-y-6 shadow-xl shadow-primary/5">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg group-hover:scale-105 transition-transform">
                    {(profile.display_name || user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{profile.display_name || "Seu nome"}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {profile.email || user?.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Nome de Exibição / Apelido</Label>
                  <Input
                    value={profile.display_name || ""}
                    placeholder="Ex: Victor Silva"
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    className="bg-secondary/50 border-primary/10 focus:border-primary/30 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Telefone / WhatsApp</Label>
                  <Input
                    value={profile.phone || ""}
                    placeholder="(11) 99999-9999"
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="bg-secondary/50 border-primary/10 focus:border-primary/30 h-11"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Email de Acesso</Label>
                  <Input
                    value={profile.email || user?.email || ""}
                    disabled
                    className="bg-secondary/30 border-primary/5 opacity-60 h-11"
                  />
                  <p className="text-[10px] text-muted-foreground italic">O email é gerenciado pela autenticação central e não pode ser alterado por aqui.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={save}
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/90 h-11 shadow-lg shadow-primary/20"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sincronizando...
                    </span>
                  ) : "Salvar Alterações"}
                </Button>
                <Button variant="ghost" onClick={() => window.location.reload()} className="h-11 border border-primary/5 hover:bg-primary/5">
                  Descartar
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="empresa" className="mt-4">
            <div className="bg-card rounded-xl border border-primary/10 p-6 space-y-6 shadow-xl shadow-primary/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Identidade Corporativa</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Nome da Empresa</Label>
                  <Input
                    value={profile.company_name || ""}
                    placeholder="Ex: Rataria Solutions"
                    onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                    className="bg-secondary/50 border-primary/10 focus:border-primary/30 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">CNPJ</Label>
                  <Input
                    value={profile.company_cnpj || ""}
                    placeholder="00.000.000/0001-00"
                    onChange={(e) => setProfile({ ...profile, company_cnpj: e.target.value })}
                    className="bg-secondary/50 border-primary/10 focus:border-primary/30 h-11"
                  />
                </div>
              </div>

              <Button onClick={save} disabled={loading} className="w-full bg-primary hover:bg-primary/90 h-11">
                {loading ? "Salvando..." : "Atualizar Cadastro Comercial"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notificacoes" className="mt-4">
            <div className="bg-card rounded-xl border border-primary/10 p-6 space-y-6 shadow-xl shadow-primary/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Canais de Alerta</h3>
              </div>

              <div className="space-y-1">
                {[
                  { key: "new_leads", label: "Novos Leads Prospectados", desc: "Alertar quando uma nova empresa for adicionada ao CRM" },
                  { key: "follow_ups", label: "Follow-ups Pendentes", desc: "Lembretes diários de tarefas de acompanhamento" },
                  { key: "proposals", label: "Propostas Visualizadas", desc: "Saber quando o cliente abrir seu link de proposta" },
                  { key: "ai_summary", label: "Rataria AI: Resumo Diário", desc: "Resumo gerado por IA sobre sua performance e novas oportunidades" },
                  { key: "whatsapp_alerts", label: "WhatsApp: Alertas Diretos", desc: "Receber notificações de leads quentes direto no seu WhatsApp" },
                  { key: "lead_temperature", label: "Temperatura de Leads", desc: "Avisar quando um lead frio começar a interagir novamente" },
                  { key: "weekly_reports", label: "Relatórios Semanais", desc: "Estatísticas de conversão e sugestões de estratégia da Rataria" },
                  { key: "critical_updates", label: "Atualizações Críticas", desc: "Novas funcionalidades e avisos de sistema" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-4 border-b border-border last:border-0 group">
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={((profile as any).notification_preferences)?.[item.key] !== false}
                      onCheckedChange={(checked) => {
                        const prefs = { ...((profile as any).notification_preferences as any) || {} };
                        prefs[item.key] = checked;
                        setProfile({ ...profile, notification_preferences: prefs } as any);
                      }}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                ))}
              </div>
              <Button onClick={save} disabled={loading} className="w-full bg-primary hover:bg-primary/90 h-11 mt-4">
                {loading ? "Sincronizando..." : "Salvar Preferências de Notificação"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="seguranca" className="mt-4">
            <div className="bg-card rounded-xl border border-primary/10 p-6 space-y-6 shadow-xl shadow-primary/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Proteção da Conta</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg border border-primary/5">
                  <p className="text-xs text-muted-foreground mb-4">Para sua segurança, a alteração de senha requer a verificação do email atual.</p>
                  <Button
                    variant="outline"
                    className="w-full border-primary/10 hover:bg-primary/5 h-10"
                    onClick={() => {
                      supabase.auth.resetPasswordForEmail(user?.email || "", {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      toast.success("Link enviado!", { description: "Verifique seu email para redefinir a senha." });
                    }}
                  >
                    Solicitar Alteração por Email
                  </Button>
                </div>
              </div>

              <div className="border-t border-primary/5 pt-6 flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold text-destructive flex items-center gap-2">
                    <LogOut className="h-4 w-4" /> Zona de Perigo
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">Encerrar a sessão ou desativar o acesso de todos os dispositivos.</p>
                </div>
                <Button variant="outline" className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-all gap-2 h-11" onClick={signOut}>
                  Sair do Rataria AI
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}
