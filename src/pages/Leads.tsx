import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Search, Plus, Phone, Globe, Mail, MessageSquare, Trash2, LayoutGrid, List, Star, MapPin, ExternalLink, Archive, RotateCcw, Calendar, DollarSign, Clock, GripVertical, PhoneCall } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { format, subWeeks, subMonths, startOfMonth, endOfMonth, startOfYear, startOfDay, endOfDay, isAfter, isBefore, parseISO, differenceInDays } from "date-fns";
import { createNotification } from "@/lib/notifications";
import type { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;

const statusConfig = {
  novo: { label: "Novo", color: "bg-blue-500/20 text-blue-500", kanbanColor: "border-l-blue-500" },
  contatado: { label: "Contatado", color: "bg-purple-500/20 text-purple-500", kanbanColor: "border-l-purple-500" },
  negociando: { label: "Negociando", color: "bg-primary/20 text-primary", kanbanColor: "border-l-primary" },
  pago: { label: "Pago", color: "bg-emerald-500/20 text-emerald-500", kanbanColor: "border-l-emerald-500" },
  remarketing: { label: "Remarketing", color: "bg-pink-500/20 text-pink-500", kanbanColor: "border-l-pink-500" },
  perdido: { label: "Perdido", color: "bg-destructive/20 text-destructive", kanbanColor: "border-l-destructive" },
} as const;

type Status = keyof typeof statusConfig;
const STATUSES: Status[] = ["novo", "contatado", "negociando", "pago", "remarketing", "perdido"];

// --- Sub-components (outside to prevent flickering) ---

const LeadCard = ({
  lead,
  compact = false,
  onDragStart,
  onClick,
  archiveLead,
  restoreLead,
  permanentDeleteLead,
  showArchived,
  prospectorName,
  onClaim
}: {
  lead: Lead;
  compact?: boolean;
  onDragStart: (id: string) => void;
  onClick: (lead: Lead) => void;
  archiveLead: (id: string) => void;
  restoreLead: (id: string) => void;
  permanentDeleteLead: (id: string) => void;
  showArchived: boolean;
  prospectorName?: string;
  onClaim: (id: string) => void;
}) => {
  const daysAgo = differenceInDays(new Date(), parseISO(lead.created_at));
  const sc = statusConfig[lead.status as Status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      draggable
      onDragStart={() => onDragStart(lead.id)}
      className={`bg-card rounded-2xl border border-border/60 overflow-hidden card-hover group/card ${compact ? `border-l-4 ${sc?.kanbanColor || ""}` : ""
        }`}
    >
      {/* Header row: drag handle + name + badges + archive/delete */}
      <div className="flex items-start gap-2 p-3 pb-0">
        <div className="pt-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className="font-black text-sm text-foreground leading-tight line-clamp-2 uppercase tracking-wide cursor-pointer hover:text-primary transition-colors"
              onClick={() => onClick(lead)}
            >
              {lead.name}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-secondary/60 px-1.5 py-0.5 rounded">
                <Clock className="h-3 w-3" />{daysAgo}d
              </span>
              {lead.score != null && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${(lead.score || 0) >= 80 ? "bg-emerald-500/20 text-emerald-500" :
                  (lead.score || 0) >= 50 ? "bg-amber-500/20 text-amber-500" :
                    "bg-destructive/20 text-destructive"
                  }`}>
                  {lead.score}pts
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Archive / Delete buttons */}
        <div className="flex flex-col gap-1 shrink-0">
          {showArchived ? (
            <button
              onClick={(e) => { e.stopPropagation(); restoreLead(lead.id); }}
              className="h-7 w-7 rounded-lg flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors"
              title="Restaurar Lead"
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary" />
            </button>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); archiveLead(lead.id); }}
                className="h-7 w-7 rounded-lg flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                title="Arquivar Lead"
              >
                <Archive className="h-3.5 w-3.5 text-amber-500" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm("Excluir permanentemente este lead?")) permanentDeleteLead(lead.id); }}
                className="h-7 w-7 rounded-lg flex items-center justify-center bg-destructive/10 hover:bg-destructive/20 transition-colors"
                title="Excluir Permanentemente"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-3 pt-1.5 pb-3 pl-9 space-y-1.5">
        {/* Niche */}
        {lead.niche && (
          <p className="text-xs text-primary/80 font-semibold">{lead.niche}</p>
        )}

        {/* Website status */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <Globe className="h-3 w-3 text-muted-foreground/60" />
          {lead.website ? (
            <a
              href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
              target="_blank"
              rel="noopener"
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:underline truncate max-w-[180px]"
            >
              {lead.website.replace(/^https?:\/\//, "")}
            </a>
          ) : (
            <span className="text-muted-foreground/60 italic">Sem site</span>
          )}
        </div>

        {/* Address */}
        {(lead.address || lead.city) && (
          <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground/60" />
            <span className="line-clamp-2 leading-tight">{lead.address || lead.city}</span>
          </div>
        )}

        {/* Rating + Phone row */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {lead.rating != null && Number(lead.rating) > 0 && (
            <span className="flex items-center gap-0.5 font-bold">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              {Number(lead.rating).toFixed(1)}
            </span>
          )}
          {lead.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-muted-foreground/60" />
              {lead.phone}
            </span>
          )}
        </div>

        {/* Prospector / Claim */}
        {!lead.user_id ? (
          <Button
            size="sm"
            variant="default"
            className="h-6 px-3 py-0 text-[9px] font-black uppercase rounded-full gap-1.5 active:scale-90 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground border-0 transition-all shadow-sm"
            onClick={(e) => { e.stopPropagation(); onClaim(lead.id); }}
          >
            <Users className="h-3 w-3" /> Pegar Lead
          </Button>
        ) : prospectorName && (
          <span className="flex items-center gap-1 text-[10px] text-primary/80 font-bold uppercase tracking-tighter">
            <Users className="h-3 w-3" />
            {prospectorName}
          </span>
        )}

        {/* Action buttons row */}
        <div className="flex items-center gap-2 pt-1">
          {lead.phone && (
            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[11px] font-bold transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
          {lead.phone && (
            <a
              href={`tel:${lead.phone.replace(/\D/g, "")}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-[11px] font-bold transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5" /> Ligar
            </a>
          )}
        </div>

        {/* Footer: Details link */}
        <div className="flex items-center justify-end pt-0.5">
          <button
            onClick={() => onClick(lead)}
            className="text-[11px] text-primary/70 hover:text-primary font-semibold transition-colors"
          >
            Detalhes
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const LeadProfileDialog = ({
  selectedLead,
  onClose,
  updateStatus,
  archiveLead,
  restoreLead,
  permanentDeleteLead,
  prospectorName,
  onClaim
}: {
  selectedLead: Lead | null;
  onClose: () => void;
  updateStatus: (id: string, status: Status) => void;
  archiveLead: (id: string) => void;
  restoreLead: (id: string) => void;
  permanentDeleteLead: (id: string) => void;
  prospectorName?: string;
  onClaim: (id: string) => void;
}) => {
  if (!selectedLead) return null;
  const lead = selectedLead;
  const sc = statusConfig[lead.status as Status];
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(lead.name + " " + (lead.address || lead.city || ""))}`;

  return (
    <Dialog open={!!selectedLead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg shadow-2xl p-0 overflow-hidden rounded-[2.5rem]">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/50 to-transparent" />

        <div className="p-8 space-y-8">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={`${sc?.color || ""} border-0 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-primary/5`}>
                {sc?.label || lead.status}
              </Badge>
              {lead.user_id ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border border-border/40 flex items-center gap-1.5">
                    <Users className="h-3 w-3" />
                    BDR: {prospectorName}
                  </span>
                </div>
              ) : (
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest animate-pulse border-primary/30 text-primary bg-primary/5">
                  Disponível para Pegar
                </Badge>
              )}
            </div>
            <DialogTitle className="text-4xl font-black tracking-tight text-foreground leading-[1.1] pt-1">
              {lead.name}
            </DialogTitle>
          </DialogHeader>

          {/* Stats Board */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-secondary/20 rounded-[2.5rem] p-6 border border-border/40 flex flex-col items-center justify-center text-center group hover:bg-secondary/30 transition-all duration-300 shadow-inner">
              <span className="text-[10px] uppercase text-muted-foreground font-black tracking-widest mb-2 shadow-sm px-3 py-1 rounded-full bg-background/80">Precisão IA</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-4xl font-black tracking-tighter ${(lead.score || 0) >= 80 ? "text-emerald-500" : (lead.score || 0) >= 50 ? "text-amber-500" : "text-muted-foreground"}`}>
                  {lead.score || "100"}
                </span>
                <span className="text-sm font-bold text-muted-foreground/40 font-mono">%</span>
              </div>
            </div>
            <div className="bg-secondary/20 rounded-[2.5rem] p-6 border border-border/40 flex flex-col items-center justify-center text-center group hover:bg-secondary/30 transition-all duration-300 shadow-inner">
              <span className="text-[10px] uppercase text-muted-foreground font-black tracking-widest mb-2 shadow-sm px-3 py-1 rounded-full bg-background/80">Avaliação</span>
              <div className="flex items-center gap-2 mt-1">
                <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                <span className="text-4xl font-black tracking-tighter text-foreground">
                  {Number(lead.rating) > 0 ? Number(lead.rating).toFixed(1) : "4.8"}
                </span>
              </div>
            </div>
          </div>

          {/* Info Sections */}
          <div className="space-y-4">
            <div className="p-6 bg-secondary/30 rounded-[2.5rem] border border-border/40 group hover:border-primary/20 transition-all">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10 group-hover:scale-110 transition-transform">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Localização</p>
                  <p className="text-sm font-bold text-foreground leading-relaxed">{lead.address || "Endereço não informado"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-secondary/30 rounded-[2.5rem] border border-border/40 group hover:border-emerald-500/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/10 group-hover:scale-110 transition-transform">
                    <Phone className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Telefone</p>
                    <p className="text-xs font-bold text-foreground truncate">{lead.phone || "---"}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-secondary/30 rounded-[2.5rem] border border-border/40 group hover:border-blue-500/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/10 group-hover:scale-110 transition-transform">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">E-mail</p>
                    <p className="text-xs font-bold text-foreground truncate">{lead.email || "---"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Change */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Jornada do Lead</h4>
              <Badge variant="secondary" className="text-[9px] bg-secondary/50 font-black uppercase p-1 px-2">{sc?.label}</Badge>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(lead.id, status)}
                  className={`py-3 text-[9px] font-extrabold uppercase tracking-widest rounded-2xl border transition-all active:scale-95 ${lead.status === status
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-secondary/40 border-border/40 text-muted-foreground hover:bg-secondary hover:border-border"
                    }`}
                >
                  {statusConfig[status].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-border/40">
            {!lead.user_id && (
              <Button
                onClick={() => { onClaim(lead.id); onClose(); }}
                className="w-full h-16 rounded-3xl bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-xl shadow-primary/20 border-0 gap-3 active:scale-[0.98] transition-all"
              >
                <Users className="h-5 w-5" />
                PEGAR ESTE LEAD AGORA
              </Button>
            )}
            <div className="flex items-center gap-3">
              <Button
                asChild
                className="flex-1 h-16 rounded-3xl bg-secondary/50 hover:bg-secondary text-foreground font-black border border-border/60 gap-3 active:scale-[0.98] transition-all"
              >
                <a href={mapsUrl} target="_blank" rel="noopener">
                  <MapPin className="h-5 w-5 text-primary" />
                  Google Maps
                </a>
              </Button>
              <Button
                asChild
                className="flex-1 h-16 rounded-3xl bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-xl shadow-emerald-500/20 border-0 gap-3 active:scale-[0.98] transition-all"
              >
                <a href={`https://wa.me/${lead.phone?.replace(/\D/g, "")}`} target="_blank" rel="noopener">
                  <MessageSquare className="h-5 w-5" />
                  WhatsApp
                </a>
              </Button>

              <div className="flex-none">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-16 w-16 rounded-3xl text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-all border border-border/40 hover:border-destructive/20 active:scale-90">
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-6 rounded-[2.5rem] border-border shadow-2xl" align="end">
                    <h3 className="text-base font-black mb-1">Gerenciar Lead</h3>
                    <p className="text-xs text-muted-foreground mb-4 font-medium leading-relaxed">Arquive para limpar sua visão ou exclua o lead definitivamente de sua base.</p>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" className="rounded-2xl font-bold h-12 hover:bg-secondary transition-all" onClick={() => { archiveLead(lead.id); onClose(); }}>Arquivar</Button>
                      <Button variant="destructive" className="rounded-2xl font-black h-12 active:scale-95 transition-all" onClick={() => { permanentDeleteLead(lead.id); onClose(); }}>Excluir Permanente</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Component ---

export default function Leads() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", niche: "", city: "", state: "", website: "", address: "" });
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [leadToPay, setLeadToPay] = useState<Lead | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringAmount, setRecurringAmount] = useState<string>("");

  const fetchLeads = async () => {
    if (!user) {
      setLeads([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Agora o CRM é compartilhado: todos os usuários veem todos os leads
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro Supabase:", error);
        toast.error(`Erro ao carregar leads: ${error.message}`);
        setLeads([]);
      } else {
        setLeads(data || []);
      }
    } catch (err) {
      console.error("Erro inesperado ao carregar leads:", err);
      setLeads([]);
    } finally {
      // Always stop loading, regardless of what happens
      setLoading(false);
    }

    // Fetch profiles separately (non-blocking, fire-and-forget)
    supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .then(({ data: profilesData }) => {
        if (profilesData) setProfiles(profilesData);
      })
      .catch((e) => console.error("Erro perfis:", e));
  };

  useEffect(() => { fetchLeads(); }, [user, isAdmin]);

  const addLead = async () => {
    if (!user || !newLead.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const { error } = await supabase.from("leads").insert({
      user_id: user.id,
      name: newLead.name.trim(),
      email: newLead.email || null,
      phone: newLead.phone || null,
      niche: newLead.niche || null,
      website: newLead.website || null,
      address: newLead.address || null,
      has_phone: !!newLead.phone,
      has_website: !!newLead.website,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Lead adicionado!");
    setShowAdd(false);
    setNewLead({ name: "", email: "", phone: "", niche: "", city: "", state: "", website: "", address: "" });
    fetchLeads();
  };

  const updateStatus = async (id: string, status: Status) => {
    if (status === "pago") {
      // Verifica se o lead já possui faturamento/assinatura
      const { data: payRecords } = await supabase.from('payments').select('id').eq('lead_id', id).limit(1);
      const { data: subRecords } = await supabase.from('subscriptions').select('id').eq('lead_id', id).limit(1);

      const hasPaymentInfo = (payRecords && payRecords.length > 0) || (subRecords && subRecords.length > 0);

      if (hasPaymentInfo) {
        // Apenas muda o status localmente e no banco sem abrir o popup (evita duplicidade)
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } as Lead : l)));
        if (selectedLead?.id === id) {
          setSelectedLead((prev) => (prev ? ({ ...prev, status } as Lead) : null));
        }
        await supabase.from("leads").update({ status } as any).eq("id", id);
        toast.info("Status alterado para Pago. O faturamento desse lead já havia sido registrado!");
        return;
      }

      const currentLead = leads.find(l => l.id === id);
      setLeadToPay(currentLead || null);
      setPaymentAmount("");
      setIsRecurring(false);
      setRecurringAmount("");
      return;
    }

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } as Lead : l)));
    if (selectedLead?.id === id) {
      setSelectedLead((prev) => (prev ? ({ ...prev, status } as Lead) : null));
    }

    const { error } = await supabase.from("leads").update({ status } as any).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status: " + error.message);
      return;
    }
  };

  const confirmPayment = async () => {
    if (!leadToPay) return;
    const amountNum = parseFloat(paymentAmount.replace(",", ".") || "0");
    const recNum = parseFloat(recurringAmount.replace(",", ".") || "0");

    if (amountNum <= 0 && (!isRecurring || recNum <= 0)) {
      toast.error("Informe pelo menos um valor válido (Única ou Recorrência).");
      return;
    }

    setLeads((prev) => prev.map((l) => (l.id === leadToPay.id ? { ...l, status: "pago" } as Lead : l)));
    if (selectedLead?.id === leadToPay.id) {
      setSelectedLead((prev) => (prev ? ({ ...prev, status: "pago" as Status } as Lead) : null));
    }

    await supabase.from("leads").update({ status: "pago" } as any).eq("id", leadToPay.id);

    let successMsg = "";

    if (amountNum > 0) {
      const { error: payError } = await supabase.from('payments').insert({
        lead_id: leadToPay.id,
        amount: amountNum,
        status: 'pendente',
        user_id: leadToPay.user_id || user?.id || ""
      });
      if (payError) { toast.error("Erro ao registrar venda: " + payError.message); return; }
      successMsg += "Venda registrada. ";
    }

    if (isRecurring && recNum > 0) {
      const { error: subError } = await supabase.from('subscriptions').insert({
        lead_id: leadToPay.id,
        amount: recNum,
        status: 'ativo'
      });
      if (subError) { toast.error("Erro ao ativar recorrência: " + subError.message); return; }
      successMsg += "Recorrência ativada!";
    }

    if (successMsg) toast.success(successMsg);
    setLeadToPay(null);
  };

  const archiveLead = async (id: string) => {
    await supabase.from("leads").update({ archived: true } as any).eq("id", id);
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, archived: true } as Lead : l));
    toast.success("Lead arquivado");
  };

  const restoreLead = async (id: string) => {
    await supabase.from("leads").update({ archived: false } as any).eq("id", id);
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, archived: false } as Lead : l));
    toast.success("Lead restaurado");
  };

  const permanentDeleteLead = async (id: string) => {
    await supabase.from("leads").delete().eq("id", id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast.success("Lead excluído permanentemente");
  };

  const claimLead = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("leads").update({ user_id: user.id } as any).eq("id", id);
    if (error) {
      toast.error("Erro ao pegar lead");
      return;
    }
    toast.success("Lead atribuído a você!");

    // Notify about lead claim
    const lead = leads.find(l => l.id === id);
    if (lead) {
      await createNotification(
        user.id,
        "Lead Atribuído! 🎯",
        `Você assumiu o atendimento de ${lead.name}. Boa sorte no fechamento!`,
        'lead'
      );
    }

    fetchLeads();
  };

  const activeLeads = leads.filter((l) => !(l as any).archived);
  const archivedLeads = leads.filter((l) => (l as any).archived);

  const getDateRange = (): { from: Date | null; to: Date | null } => {
    const now = new Date();
    switch (periodFilter) {
      case "hoje": return { from: startOfDay(now), to: endOfDay(now) };
      case "3semanas": return { from: subWeeks(now, 3), to: now };
      case "mes": return { from: startOfMonth(now), to: endOfMonth(now) };
      case "mes_passado": {
        const lastMonth = subMonths(now, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      }
      case "ano": return { from: startOfYear(now), to: now };
      case "custom": return {
        from: customFrom ? startOfDay(parseISO(customFrom)) : null,
        to: customTo ? endOfDay(parseISO(customTo)) : null,
      };
      default: return { from: null, to: null };
    }
  };

  const filtered = (showArchived ? archivedLeads : activeLeads).filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.niche || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const { from, to } = getDateRange();
    const createdAt = parseISO(l.created_at);
    const matchDate = (!from || isAfter(createdAt, from)) && (!to || isBefore(createdAt, to));
    return matchSearch && matchStatus && matchDate;
  });

  const handleDragStart = (leadId: string) => setDraggedLead(leadId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (status: Status) => {
    if (draggedLead) { updateStatus(draggedLead, status); setDraggedLead(null); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" /> CRM Prospecção
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {showArchived ? `${archivedLeads.length} arquivados` : `${activeLeads.length} leads ativos`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-secondary rounded-lg p-0.5 border border-border">
              <button
                onClick={() => setView("kanban")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === "kanban" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className="h-3.5 w-3.5" />
              {showArchived ? "Ver Ativos" : "Arquivados"}
            </Button>
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Lead</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-lg rounded-3xl">
                <DialogHeader><DialogTitle className="text-xl font-black">Novo Lead Manual</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nome *</Label><Input value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} className="bg-secondary border-border" placeholder="Nome do Lead" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Nicho (Opcional)</Label><Input value={newLead.niche} onChange={(e) => setNewLead({ ...newLead, niche: e.target.value })} className="bg-secondary border-border" placeholder="Ex: Barbearia" /></div>
                    <div><Label>Website (Opcional)</Label><Input value={newLead.website} onChange={(e) => setNewLead({ ...newLead, website: e.target.value })} className="bg-secondary border-border" placeholder="Ex: www.site.com" /></div>
                  </div>
                  <div><Label>Endereço (Opcional)</Label><Input value={newLead.address} onChange={(e) => setNewLead({ ...newLead, address: e.target.value })} className="bg-secondary border-border" placeholder="Rua, Número, Bairro, Cidade" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Email (Opcional)</Label><Input value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} className="bg-secondary border-border" placeholder="email@exemplo.com" /></div>
                    <div><Label>Telefone (Opcional)</Label><Input value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} className="bg-secondary border-border" placeholder="+55 21 99999-9999" /></div>
                  </div>
                  <Button onClick={addLead} className="w-full h-12 rounded-2xl font-bold">Criar Lead</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, nicho ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card border-border py-5"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-card border-border"><SelectValue placeholder="Todos Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Filtro: Todos</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-card/50 rounded-2xl border border-dashed border-border p-20 text-center">
            <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Sua base está vazia</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
              Vá para a página de Prospecção para encontrar novas oportunidades.
            </p>
          </div>
        ) : view === "kanban" ? (
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide min-h-[600px] -mx-4 px-4 sm:mx-0 sm:px-0">
            {STATUSES.map((status) => {
              const statusLeads = filtered.filter((l) => l.status === status);
              return (
                <div
                  key={status}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(status)}
                  className={`bg-secondary/20 rounded-2xl p-4 flex-shrink-0 w-[300px] min-h-[500px] border border-transparent transition-all duration-300 ${draggedLead ? "border-primary/20 bg-primary/5 ring-4 ring-primary/5" : ""
                    }`}
                >
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground/60">
                      {statusConfig[status].label}
                    </h3>
                    <Badge variant="secondary" className="text-[10px] bg-background/50 border-border px-1.5 h-5 min-w-[20px] justify-center">
                      {statusLeads.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {statusLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          compact
                          onDragStart={handleDragStart}
                          onClick={setSelectedLead}
                          archiveLead={archiveLead}
                          restoreLead={restoreLead}
                          permanentDeleteLead={permanentDeleteLead}
                          showArchived={showArchived}
                          prospectorName={profiles.find(p => p.user_id === lead.user_id)?.display_name || profiles.find(p => p.user_id === lead.user_id)?.email}
                          onClaim={claimLead}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onDragStart={handleDragStart}
                  onClick={setSelectedLead}
                  archiveLead={archiveLead}
                  restoreLead={restoreLead}
                  permanentDeleteLead={permanentDeleteLead}
                  showArchived={showArchived}
                  prospectorName={profiles.find(p => p.user_id === lead.user_id)?.display_name || profiles.find(p => p.user_id === lead.user_id)?.email}
                  onClaim={claimLead}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <LeadProfileDialog
        selectedLead={selectedLead}
        onClose={() => setSelectedLead(null)}
        updateStatus={updateStatus}
        archiveLead={archiveLead}
        restoreLead={restoreLead}
        permanentDeleteLead={permanentDeleteLead}
        prospectorName={profiles.find(p => p.user_id === (selectedLead as any)?.user_id)?.display_name || profiles.find(p => p.user_id === (selectedLead as any)?.user_id)?.email}
        onClaim={claimLead}
      />

      {/* Payment Popup */}
      <Dialog open={!!leadToPay} onOpenChange={(open) => !open && setLeadToPay(null)}>
        <DialogContent className="bg-card border-border max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Registrar Fechamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Valor Venda Única (Setup) R$</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Ex: 500,00 (Deixe 0 se não houver)"
                className="h-12 rounded-2xl bg-background/50 border-primary/20 font-bold"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Venda Recorrente?</Label>
                  <p className="text-[10px] text-muted-foreground ml-1">Ative para criar uma assinatura/MRR</p>
                </div>
                <div
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${isRecurring ? 'bg-indigo-500' : 'bg-muted/40'}`}
                  onClick={() => setIsRecurring(!isRecurring)}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-0'}`}
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isRecurring && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Label className="text-[10px] uppercase font-black tracking-widest text-indigo-500 ml-1">Valor da Mensalidade (R$)</Label>
                  <Input
                    type="number"
                    value={recurringAmount}
                    onChange={(e) => setRecurringAmount(e.target.value)}
                    placeholder="Ex: 250,00"
                    className="h-12 rounded-2xl bg-indigo-500/5 border-indigo-500/20 font-bold text-indigo-500 focus-visible:ring-indigo-500"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <Button onClick={confirmPayment} className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-bold shadow-lg shadow-emerald-500/20 text-white">
              Confirmar Recebimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
