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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, Search, Plus, Phone, Globe, Mail, MessageSquare, Trash2, LayoutGrid, List, GripVertical, Star, MapPin, ExternalLink, Clock, Archive, RotateCcw, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, subWeeks, subMonths, startOfMonth, endOfMonth, startOfYear, startOfDay, endOfDay, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;

const statusConfig = {
  novo: { label: "Novo", color: "bg-muted-foreground/20 text-muted-foreground", kanbanColor: "border-l-muted-foreground" },
  contato: { label: "Contato", color: "bg-info/20 text-info", kanbanColor: "border-l-info" },
  proposta: { label: "Proposta", color: "bg-warning/20 text-warning", kanbanColor: "border-l-warning" },
  fechado: { label: "Fechado", color: "bg-primary/20 text-primary", kanbanColor: "border-l-primary" },
  perdido: { label: "Perdido", color: "bg-destructive/20 text-destructive", kanbanColor: "border-l-destructive" },
} as const;

type Status = keyof typeof statusConfig;
const STATUSES: Status[] = ["novo", "contato", "proposta", "fechado", "perdido"];

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", niche: "", city: "", state: "", website: "" });
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const fetchLeads = async () => {
    if (!user) {
      setLeads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar leads");
      setLeads([]);
    } else {
      setLeads(data || []);
    }

    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, [user]);

  const addLead = async () => {
    if (!user || !newLead.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const { error } = await supabase.from("leads").insert({
      user_id: user.id, name: newLead.name.trim(),
      email: newLead.email || null, phone: newLead.phone || null,
      niche: newLead.niche || null, city: newLead.city || null, state: newLead.state || null,
      website: newLead.website || null,
      has_phone: !!newLead.phone, has_website: !!newLead.website,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Lead adicionado!");
    setShowAdd(false);
    setNewLead({ name: "", email: "", phone: "", niche: "", city: "", state: "", website: "" });
    fetchLeads();
  };

  const updateStatus = async (id: string, status: Status) => {
    await supabase.from("leads").update({ status }).eq("id", id);
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
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

  const LeadCard = ({ lead, compact = false }: { lead: Lead; compact?: boolean }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={() => handleDragStart(lead.id)}
      onClick={() => setSelectedLead(lead)}
      className={`bg-card rounded-lg border border-border p-3 card-hover cursor-pointer ${
        compact ? `border-l-4 ${statusConfig[lead.status as Status]?.kanbanColor || ""}` : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm text-foreground truncate">{lead.name}</h4>
            {!compact && (
              <Badge className={`${statusConfig[lead.status as Status]?.color || ""} border-0 text-[10px]`}>
                {statusConfig[lead.status as Status]?.label || lead.status}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {lead.niche && <span>{lead.niche}</span>}
            {lead.city && <span>{lead.city}</span>}
            {lead.rating && (
              <span className="text-warning">★ {Number(lead.rating).toFixed(1)}</span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(parseISO(lead.created_at), "dd/MM/yyyy")}
            </span>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {lead.phone && (
            <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener"
              onClick={(e) => e.stopPropagation()}
              className="h-7 w-7 rounded flex items-center justify-center hover:bg-accent transition-colors">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
            </a>
          )}
          {showArchived ? (
            <button onClick={(e) => { e.stopPropagation(); restoreLead(lead.id); }}
              className="h-7 w-7 rounded flex items-center justify-center hover:bg-primary/10 transition-colors">
              <RotateCcw className="h-3.5 w-3.5 text-primary" />
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); archiveLead(lead.id); }}
              className="h-7 w-7 rounded flex items-center justify-center hover:bg-destructive/10 transition-colors">
              <Archive className="h-3.5 w-3.5 text-destructive" />
            </button>
          )}
        </div>
      </div>
      {!compact && (
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
          {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
          {lead.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{lead.website}</span>}
        </div>
      )}
    </motion.div>
  );

  const LeadProfileDialog = () => {
    if (!selectedLead) return null;
    const lead = selectedLead;
    const sc = statusConfig[lead.status as Status];
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(lead.name + " " + (lead.address || lead.city || ""))}`;

    return (
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-lg">{lead.name}</span>
              <Badge className={`${sc?.color || ""} border-0 text-[10px]`}>{sc?.label || lead.status}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Score & Rating */}
            <div className="flex items-center gap-4">
              {lead.score != null && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Score:</span>
                  <span className={`text-sm font-bold ${(lead.score || 0) >= 80 ? "text-primary" : (lead.score || 0) >= 50 ? "text-warning" : "text-muted-foreground"}`}>
                    {lead.score}
                  </span>
                </div>
              )}
              {lead.rating != null && Number(lead.rating) > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                  <span className="text-sm font-medium">{Number(lead.rating).toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Info rows */}
            <div className="space-y-2.5">
              {lead.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-foreground">{lead.address}</span>
                </div>
              )}
              {(lead.city || lead.state) && !lead.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{[lead.city, lead.state].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {lead.niche && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground text-xs w-16">Nicho:</span>
                  <span className="text-foreground">{lead.niche}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="text-foreground hover:text-primary transition-colors">{lead.phone}</a>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="text-foreground hover:text-primary transition-colors">{lead.email}</a>
                </div>
              )}
              {lead.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener" className="text-foreground hover:text-primary transition-colors truncate">
                    {lead.website}
                  </a>
                </div>
              )}
              {lead.notes && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground text-xs w-16 shrink-0">Notas:</span>
                  <span className="text-foreground">{lead.notes}</span>
                </div>
              )}
            </div>

            {/* Status selector */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Alterar Status</Label>
              <Select value={lead.status} onValueChange={(v) => { updateStatus(lead.id, v as Status); setSelectedLead({ ...lead, status: v as Lead["status"] }); }}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap pt-2">
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <a href={mapsUrl} target="_blank" rel="noopener">
                  <MapPin className="h-3.5 w-3.5" /> Ver no Maps
                </a>
              </Button>
              {lead.phone && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener">
                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                </Button>
              )}
              {lead.website && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener">
                    <ExternalLink className="h-3.5 w-3.5" /> Site
                  </a>
                </Button>
              )}
              {(selectedLead as any)?.archived ? (
                <Button variant="outline" size="sm" className="gap-1.5 ml-auto" onClick={() => { restoreLead(lead.id); setSelectedLead(null); }}>
                  <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                </Button>
              ) : (
                <Button variant="destructive" size="sm" className="gap-1.5 ml-auto" onClick={() => { archiveLead(lead.id); setSelectedLead(null); }}>
                  <Archive className="h-3.5 w-3.5" /> Arquivar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
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
            <div className="flex bg-secondary rounded-lg p-0.5">
              <button onClick={() => setView("kanban")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setView("list")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
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
              Arquivados {archivedLeads.length > 0 && <Badge variant="secondary" className="text-[10px] ml-1">{archivedLeads.length}</Badge>}
            </Button>
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> Adicionar Lead</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nome *</Label><Input value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} className="bg-secondary border-border" placeholder="Nome da empresa" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Email</Label><Input value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} className="bg-secondary border-border" /></div>
                    <div><Label>Telefone</Label><Input value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} className="bg-secondary border-border" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Nicho</Label><Input value={newLead.niche} onChange={(e) => setNewLead({ ...newLead, niche: e.target.value })} className="bg-secondary border-border" /></div>
                    <div><Label>Website</Label><Input value={newLead.website} onChange={(e) => setNewLead({ ...newLead, website: e.target.value })} className="bg-secondary border-border" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Cidade</Label><Input value={newLead.city} onChange={(e) => setNewLead({ ...newLead, city: e.target.value })} className="bg-secondary border-border" /></div>
                    <div><Label>Estado</Label><Input value={newLead.state} onChange={(e) => setNewLead({ ...newLead, state: e.target.value })} className="bg-secondary border-border" /></div>
                  </div>
                  <Button onClick={addLead} className="w-full">Salvar Lead</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex gap-2 flex-wrap items-center">
          {[
            { key: "all", label: "Todos" },
            { key: "hoje", label: "Hoje" },
            { key: "3semanas", label: "3 Semanas" },
            { key: "mes", label: "Este Mês" },
            { key: "mes_passado", label: "Mês Passado" },
            { key: "ano", label: "Este Ano" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodFilter(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                periodFilter === p.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  periodFilter === "custom"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" /> Período
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 space-y-2 bg-card border-border" align="end">
              <div className="flex items-center gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">De</Label>
                  <Input type="date" value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); setPeriodFilter("custom"); }} className="bg-secondary border-border text-xs h-8" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Até</Label>
                  <Input type="date" value={customTo} onChange={(e) => { setCustomTo(e.target.value); setPeriodFilter("custom"); }} className="bg-secondary border-border text-xs h-8" />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search & Status Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-card border-border" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-card border-border"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : leads.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Users className="h-14 w-14 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Nenhum lead salvo ainda</h3>
            <p className="text-sm text-muted-foreground">Extraia empresas na página de Prospecção para popular o CRM.</p>
          </div>
        ) : view === "kanban" ? (
          /* Kanban view */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto">
            {STATUSES.map((status) => {
              const statusLeads = filtered.filter((l) => l.status === status);
              return (
                <div
                  key={status}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(status)}
                  className="bg-secondary/50 rounded-xl p-3 min-h-[200px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {statusConfig[status].label}
                    </h3>
                    <Badge variant="outline" className="text-[10px] border-border">
                      {statusLeads.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {statusLeads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} compact />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <LeadProfileDialog />
    </DashboardLayout>
  );
}
