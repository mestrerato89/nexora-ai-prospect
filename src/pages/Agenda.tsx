import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Plus, Clock, CheckCircle, AlertCircle, ChevronRight, Filter, Search, User, MapPin, History } from "lucide-react";
import { format, isPast, isToday, isTomorrow, startOfDay, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadSelector } from "@/components/LeadSelector";
import { motion, AnimatePresence } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type FollowUp = Tables<"follow_ups">;

export default function Agenda() {
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [priority, setPriority] = useState<"baixa" | "media" | "alta">("media");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filter, setFilter] = useState<"all" | "today" | "pending" | "overdue">("all");

  const fetchData = async () => {
    if (!user) return;
    const [fuRes, leadsRes] = await Promise.all([
      supabase
        .from("follow_ups")
        .select("*, leads(name, city)")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true }),
      supabase
        .from("leads")
        .select("id, name")
        .eq("user_id", user.id)
    ]);

    setFollowUps(fuRes.data || []);
    setLeads(leadsRes.data || []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const addFollowUp = async () => {
    if (!user || !title || !dueDate) {
      toast.error("Preencha o título e a data.");
      return;
    }
    const { error } = await supabase.from("follow_ups").insert({
      user_id: user.id,
      title,
      description: description || null,
      due_date: new Date(dueDate).toISOString(),
      lead_id: selectedLeadId || null,
      priority: priority
    } as any);

    if (error) {
      if (error.message.includes("schema cache")) {
        toast.error("Erro: A tabela de agenda não foi encontrada. Por favor, execute a migração SQL.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Evento agendado!");
    setShowAdd(false);
    setTitle(""); setDueDate(""); setDescription(""); setSelectedLeadId("");
    fetchData();
  };

  const toggleComplete = async (fu: any) => {
    await supabase.from("follow_ups").update({
      completed: !fu.completed,
      completed_at: fu.completed ? null : new Date().toISOString(),
    }).eq("id", fu.id);
    fetchData();
  };

  const filteredFollowUps = followUps.filter(fu => {
    const d = new Date(fu.due_date);
    if (filter === "today") return isToday(d) && !fu.completed;
    if (filter === "overdue") return isPast(d) && !isToday(d) && !fu.completed;
    if (filter === "pending") return !fu.completed;
    if (selectedDate) return isSameDay(d, selectedDate);
    return true;
  });

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'alta': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'media': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  const pending = followUps.filter((f) => !f.completed);
  const completed = followUps.filter((f) => f.completed);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px] mx-auto pb-20">
        {/* Sidebar / Calendar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border/50 p-6 shadow-xl shadow-primary/5">
            <h1 className="text-2xl font-black text-foreground tracking-tighter flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
              Minha Agenda
            </h1>

            <div className="bg-background/50 rounded-3xl p-2 border border-border/40">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                className="rounded-2xl"
              />
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Filtros Rápidos</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'Tudo', icon: Filter },
                  { id: 'today', label: 'Hoje', icon: Clock },
                  { id: 'pending', label: 'Pendentes', icon: AlertCircle },
                  { id: 'overdue', label: 'Atrasados', icon: History },
                ].map((f) => (
                  <Button
                    key={f.id}
                    variant={filter === f.id ? "default" : "outline"}
                    onClick={() => { setFilter(f.id as any); setSelectedDate(undefined); }}
                    className="h-12 rounded-2xl gap-2 font-bold justify-start px-4 transition-all"
                  >
                    <f.icon className="h-4 w-4 shrink-0" />
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button className="w-full h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-xl shadow-primary/20 gap-3 active:scale-[0.98] transition-all">
                <Plus className="h-5 w-5" />
                NOVO COMPROMISSO
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle className="text-xl font-black">Agendar Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">O que precisa ser feito?</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Ligar para decisão final" className="h-12 rounded-2xl bg-secondary border-border font-bold" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Quando?</Label>
                    <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-12 rounded-2xl bg-secondary border-border font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Prioridade</Label>
                    <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                      <SelectTrigger className="h-12 rounded-2xl bg-secondary border-border font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Vincular a um Lead</Label>
                  <LeadSelector
                    leads={leads}
                    value={selectedLeadId}
                    onValueChange={setSelectedLeadId}
                    placeholder="Pesquise o nome do lead..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Observações</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes extras..." className="h-12 rounded-2xl bg-secondary border-border" />
                </div>

                <Button onClick={addFollowUp} className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black shadow-lg shadow-primary/20 mt-4">
                  SALVAR NA AGENDA
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Content / List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
              {filter === 'all' && selectedDate ? `Agendado para ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}` : `Resultados: ${filter}`}
            </h2>
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20">
              {filteredFollowUps.length} Eventos
            </Badge>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredFollowUps.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card/30 backdrop-blur-md rounded-[2.5rem] border border-dashed border-border p-20 text-center"
                >
                  <div className="h-16 w-16 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Nada agendado para este filtro</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2 font-medium">Use os filtros à esquerda ou o calendário para explorar sua agenda.</p>
                </motion.div>
              ) : (
                filteredFollowUps.map((fu, idx) => {
                  const overdue = isPast(new Date(fu.due_date)) && !isToday(new Date(fu.due_date)) && !fu.completed;
                  const isTodayTask = isToday(new Date(fu.due_date));

                  return (
                    <motion.div
                      key={fu.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`bg-card rounded-[2rem] border p-6 flex items-start gap-6 transition-all group ${fu.completed ? 'opacity-40' : 'hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 backdrop-blur-sm'} ${overdue ? "border-destructive/30 bg-destructive/[0.02]" : "border-border/60"}`}
                    >
                      <button
                        onClick={() => toggleComplete(fu)}
                        className={`h-7 w-7 rounded-xl border-2 shrink-0 transition-all flex items-center justify-center ${fu.completed ? 'bg-primary border-primary' : 'border-muted-foreground/30 hover:border-primary active:scale-90'}`}
                      >
                        {fu.completed && <CheckCircle className="h-4 w-4 text-primary-foreground" />}
                      </button>

                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`font-black tracking-tight ${fu.completed ? 'line-through text-muted-foreground' : 'text-foreground text-lg group-hover:text-primary transition-colors'}`}>
                                {fu.title}
                              </h3>
                              <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border ${getPriorityColor(fu.priority || 'media')}`}>
                                {fu.priority || 'Média'}
                              </span>
                            </div>
                            {fu.description && <p className="text-sm text-muted-foreground font-medium leading-relaxed">{fu.description}</p>}
                          </div>

                          <div className="text-right shrink-0">
                            <p className={`text-xs font-black uppercase tracking-widest ${overdue ? 'text-destructive' : isTodayTask ? 'text-primary' : 'text-muted-foreground'}`}>
                              {isTodayTask ? 'Hoje' : isTomorrow(new Date(fu.due_date)) ? 'Amanhã' : format(new Date(fu.due_date), "dd MMM", { locale: ptBR })}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground opacity-60">
                              {format(new Date(fu.due_date), "HH:mm")}
                            </p>
                          </div>
                        </div>

                        {fu.leads && (
                          <div className="flex items-center gap-2 bg-secondary/40 p-3 rounded-2xl border border-border/40 w-fit">
                            <div className="h-6 w-6 rounded-lg bg-background flex items-center justify-center">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-xs font-black text-foreground">{fu.leads.name}</span>
                            {fu.leads.city && (
                              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 border-l border-border/60 pl-2">
                                <MapPin className="h-2.5 w-2.5" />
                                {fu.leads.city}
                              </span>
                            )}
                            <ChevronRight className="h-3 w-3 text-muted-foreground opacity-40 ml-1" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
