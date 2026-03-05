import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Plus, Clock, CheckCircle } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type FollowUp = Tables<"follow_ups">;

export default function Agenda() {
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  const fetchFollowUps = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("follow_ups")
      .select("*")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true });
    setFollowUps(data || []);
  };

  useEffect(() => { fetchFollowUps(); }, [user]);

  const addFollowUp = async () => {
    if (!user || !title || !dueDate) return;
    const { error } = await supabase.from("follow_ups").insert({
      user_id: user.id,
      title,
      description: description || null,
      due_date: new Date(dueDate).toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Follow-up criado!");
    setShowAdd(false);
    setTitle(""); setDueDate(""); setDescription("");
    fetchFollowUps();
  };

  const toggleComplete = async (fu: FollowUp) => {
    await supabase.from("follow_ups").update({
      completed: !fu.completed,
      completed_at: fu.completed ? null : new Date().toISOString(),
    }).eq("id", fu.id);
    fetchFollowUps();
  };

  const pending = followUps.filter((f) => !f.completed);
  const completed = followUps.filter((f) => f.completed);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" /> Agenda
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{pending.length} pendentes</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Follow-up</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Novo Follow-up</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-secondary border-border" /></div>
                <div><Label>Data e hora *</Label><Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-secondary border-border" /></div>
                <div><Label>Descrição</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary border-border" /></div>
                <Button onClick={addFollowUp} className="w-full">Criar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pendentes</h2>
          {pending.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum follow-up pendente</p>
            </div>
          ) : (
            pending.map((fu) => {
              const overdue = isPast(new Date(fu.due_date)) && !isToday(new Date(fu.due_date));
              return (
                <div key={fu.id} className={`bg-card rounded-xl border p-4 card-hover flex items-center gap-4 ${overdue ? "border-destructive/50" : "border-border"}`}>
                  <button onClick={() => toggleComplete(fu)} className="h-5 w-5 rounded-full border-2 border-muted-foreground hover:border-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{fu.title}</p>
                    {fu.description && <p className="text-xs text-muted-foreground">{fu.description}</p>}
                  </div>
                  <span className={`text-xs font-medium ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                    {format(new Date(fu.due_date), "dd MMM, HH:mm", { locale: ptBR })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Completed */}
        {completed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Concluídos</h2>
            {completed.map((fu) => (
              <div key={fu.id} className="bg-card rounded-xl border border-border p-4 opacity-60 flex items-center gap-4">
                <button onClick={() => toggleComplete(fu)} className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <CheckCircle className="h-3.5 w-3.5 text-primary-foreground" />
                </button>
                <p className="font-medium text-foreground line-through flex-1">{fu.title}</p>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(fu.due_date), "dd MMM", { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
