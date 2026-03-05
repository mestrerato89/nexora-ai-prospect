import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings, User, Building, LogOut, Bell, Shield, CreditCard, Link as LinkIcon } from "lucide-react";
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
    }).eq("user_id", user.id);
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
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                  {(profile.display_name || user?.email || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{profile.display_name || "Seu nome"}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email || user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Nome completo</Label><Input value={profile.display_name || ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} className="bg-secondary border-border" /></div>
                <div><Label>Email</Label><Input value={profile.email || ""} disabled className="bg-secondary border-border opacity-60" /></div>
                <div><Label>Telefone</Label><Input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="bg-secondary border-border" placeholder="(11) 99999-9999" /></div>
              </div>
              <div className="flex gap-3">
                <Button onClick={save} disabled={loading} className="flex-1">{loading ? "Salvando..." : "Salvar Alterações"}</Button>
                <Button variant="outline" className="border-border">Cancelar</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="empresa" className="mt-4">
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <h3 className="font-semibold text-foreground">Dados da Empresa</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Nome da empresa / Agência</Label><Input value={profile.company_name || ""} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} className="bg-secondary border-border" /></div>
                <div><Label>CNPJ</Label><Input value={profile.company_cnpj || ""} onChange={(e) => setProfile({ ...profile, company_cnpj: e.target.value })} className="bg-secondary border-border" placeholder="00.000.000/0001-00" /></div>
              </div>
              <Button onClick={save} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
            </div>
          </TabsContent>

          <TabsContent value="notificacoes" className="mt-4">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Preferências de Notificação</h3>
              {[
                { label: "Novos leads", desc: "Quando um novo lead é adicionado" },
                { label: "Follow-ups", desc: "Lembretes de follow-ups agendados" },
                { label: "Propostas aceitas", desc: "Quando uma proposta é aceita pelo cliente" },
                { label: "Atualizações da plataforma", desc: "Novidades e melhorias do sistema" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="seguranca" className="mt-4">
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <h3 className="font-semibold text-foreground">Segurança da Conta</h3>
              <div className="space-y-3">
                <div><Label>Senha atual</Label><Input type="password" className="bg-secondary border-border" placeholder="••••••••" /></div>
                <div><Label>Nova senha</Label><Input type="password" className="bg-secondary border-border" placeholder="••••••••" /></div>
                <div><Label>Confirmar nova senha</Label><Input type="password" className="bg-secondary border-border" placeholder="••••••••" /></div>
              </div>
              <Button onClick={() => toast.info("Funcionalidade em desenvolvimento")}>Alterar Senha</Button>
              <div className="border-t border-border pt-4 mt-4">
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 gap-2" onClick={signOut}>
                  <LogOut className="h-4 w-4" /> Sair da conta
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}
