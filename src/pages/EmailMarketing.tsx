import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Plus, Users, Send, Clock, UserCheck, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const STATS = [
  { icon: UserCheck, label: "Contas Ativas", value: "0", color: "bg-primary/10 text-primary" },
  { icon: Send, label: "Enviados Hoje", value: "0", color: "bg-info/10 text-info" },
  { icon: Clock, label: "Limite Restante", value: "0", color: "bg-warning/10 text-warning" },
  { icon: Users, label: "Leads c/ Email", value: "0", color: "bg-[hsl(var(--stat-icon-purple))]/10 text-[hsl(var(--stat-icon-purple))]" },
];

const TEMPLATES = [
  { name: "Abordagem Inicial", desc: "Primeira mensagem para contato frio", category: "Prospecção" },
  { name: "Follow-up 3 dias", desc: "Lembrete após primeiro contato", category: "Follow-up" },
  { name: "Proposta Comercial", desc: "Envio de proposta com detalhes do projeto", category: "Proposta" },
  { name: "Fechamento", desc: "Mensagem de negociação final", category: "Fechamento" },
];

export default function EmailMarketing() {
  const [showAdd, setShowAdd] = useState(false);
  const [showCampaign, setShowCampaign] = useState(false);
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-[1400px]"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" /> E-mail Marketing
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Configure contas SMTP e envie campanhas personalizadas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 border-border" onClick={() => setShowCampaign(true)}>
              <FileText className="h-4 w-4" /> Nova Campanha
            </Button>
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> Adicionar Conta</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Configurar Conta SMTP</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nome da conta</Label><Input placeholder="Ex: Gmail Principal" className="bg-secondary border-border" /></div>
                  <div>
                    <Label>Provedor</Label>
                    <Select>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gmail">Gmail</SelectItem>
                        <SelectItem value="outlook">Outlook</SelectItem>
                        <SelectItem value="yahoo">Yahoo</SelectItem>
                        <SelectItem value="outro">SMTP Customizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Email</Label><Input type="email" placeholder="seu@email.com" className="bg-secondary border-border" /></div>
                  <div><Label>Senha / App Password</Label><Input type="password" placeholder="••••••••" className="bg-secondary border-border" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Host SMTP</Label><Input placeholder="smtp.gmail.com" className="bg-secondary border-border" /></div>
                    <div><Label>Porta</Label><Input placeholder="587" className="bg-secondary border-border" /></div>
                  </div>
                  <Button className="w-full" onClick={() => { setShowAdd(false); toast.success("Conta SMTP salva!"); }}>
                    Testar e Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 card-hover">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Configure contas SMTP (Gmail, Outlook, Yahoo ou customizado). Limite de 100 e-mails/dia por conta.
        </p>

        {/* Templates section */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Templates de Email</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TEMPLATES.map((t) => (
              <div key={t.name} className="bg-card rounded-xl border border-border p-4 card-hover cursor-pointer group">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t.category}</span>
                <h4 className="font-semibold text-sm text-foreground mt-1 group-hover:text-primary transition-colors">{t.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Mail className="h-14 w-14 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Nenhuma conta configurada</h3>
          <p className="text-sm text-muted-foreground mb-4">Clique em "Adicionar Conta" para configurar seu SMTP.</p>
          <Button variant="outline" className="border-border" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" /> Configurar Agora
          </Button>
        </div>

        {/* Campaign Dialog */}
        <Dialog open={showCampaign} onOpenChange={setShowCampaign}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle>Nova Campanha de Email</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome da campanha</Label><Input placeholder="Ex: Abordagem Pizzarias SP" className="bg-secondary border-border" /></div>
              <div><Label>Assunto</Label><Input placeholder="Ex: Solução digital para seu negócio" className="bg-secondary border-border" /></div>
              <div>
                <Label>Template</Label>
                <Select>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione um template" /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Segmento de leads</Label>
                <Select>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os leads com email</SelectItem>
                    <SelectItem value="novo">Status: Novo</SelectItem>
                    <SelectItem value="contato">Status: Contato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => { setShowCampaign(false); toast.info("Configure uma conta SMTP antes de enviar"); }}>
                Criar Campanha
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}
