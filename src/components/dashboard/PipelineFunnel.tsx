import { useNavigate } from "react-router-dom";
import type { DashboardData } from "@/pages/Index";

const stages = [
  { key: "novos", label: "Novos", color: "bg-muted-foreground/20 text-muted-foreground" },
  { key: "leadsQuentes", label: "Contato", color: "bg-info/20 text-info" },
  { key: "proposta", label: "Proposta", color: "bg-warning/20 text-warning" },
  { key: "pagos", label: "Pagos", color: "bg-primary/20 text-primary" },
] as const;

export function PipelineFunnel({ data }: { data: DashboardData }) {
  const navigate = useNavigate();
  const convRate = data.totalLeads > 0 ? Math.round((data.pagos / data.totalLeads) * 100) : 0;

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Pipeline de Vendas</h3>
        <span className="text-xs text-muted-foreground">{convRate}% conversão</span>
      </div>
      <div className="space-y-3">
        {stages.map((s) => {
          const val = data[s.key as keyof DashboardData] as number;
          const pct = data.totalLeads > 0 ? Math.round((val / data.totalLeads) * 100) : 0;
          return (
            <button
              key={s.key}
              onClick={() => navigate("/leads")}
              className="w-full group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{s.label}</span>
                <span className="text-sm font-bold text-foreground">{val}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${s.color.split(" ")[0].replace("/20", "")}`}
                  style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: `hsl(var(--${s.color.includes("info") ? "info" : s.color.includes("warning") ? "warning" : s.color.includes("primary") ? "primary" : "muted-foreground"}))` }}
                />
              </div>
            </button>
          );
        })}
      </div>
      {data.totalLeads === 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">Nenhum lead ainda. Inicie uma prospecção!</p>
      )}
    </div>
  );
}
