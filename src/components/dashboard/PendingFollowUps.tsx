import { useState } from "react";
import { Bell, Check, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FollowUp {
  id: string;
  title: string;
  due_date: string;
  lead_id: string | null;
  completed: boolean;
}

export function PendingFollowUps({ followUps, userId }: { followUps: FollowUp[]; userId?: string }) {
  const [items, setItems] = useState(followUps);

  const markDone = async (id: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from("follow_ups")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) { toast.error("Erro ao marcar follow-up"); return; }
    setItems((prev) => prev.filter((f) => f.id !== id));
    toast.success("Follow-up concluído!");
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-info" />
        <h3 className="font-semibold text-foreground">Follow-ups Pendentes</h3>
        <span className="text-xs bg-info/20 text-info px-2 py-0.5 rounded-full font-medium ml-auto">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum follow-up pendente 🎉</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((f) => {
            const due = new Date(f.due_date);
            const overdue = isPast(due) && !isToday(due);
            return (
              <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group">
                <button
                  onClick={() => markDone(f.id)}
                  className="h-5 w-5 rounded border border-border flex items-center justify-center shrink-0 hover:bg-primary hover:border-primary transition-colors group-hover:border-primary/50"
                >
                  <Check className="h-3 w-3 text-transparent group-hover:text-primary-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{f.title}</p>
                  <p className={`text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                    {overdue && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                    {format(due, "dd MMM, HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
