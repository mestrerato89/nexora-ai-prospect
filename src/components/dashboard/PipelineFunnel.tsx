import { useNavigate } from "react-router-dom";
import type { DashboardData } from "@/pages/Index";

const stages = [
  { key: "novos", label: "Novos", color: "hsl(var(--info))" },
  { key: "contatados", label: "Contatado", color: "hsl(var(--primary))" },
  { key: "negociando", label: "Negociando", color: "hsl(38, 92%, 50%)" },
  { key: "pagos", label: "Pagos", color: "hsl(142, 71%, 45%)" },
  { key: "remarketing", label: "Remarketing", color: "hsl(330, 80%, 60%)" },
  { key: "perdidos", label: "Perdido", color: "hsl(0, 72%, 51%)" },
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
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(pct, val > 0 ? 4 : 0)}%`, backgroundColor: s.color }}
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
