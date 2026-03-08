import { Crosshair, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { DashboardData } from "@/pages/Index";

const statusConfig = [
  { key: "novos", label: "Novo", color: "text-blue-400" },
  { key: "contatados", label: "Contatado", color: "text-purple-400" },
  { key: "negociando", label: "Negociando", color: "text-yellow-400" },
  { key: "pagos", label: "Pago", color: "text-emerald-400" },
  { key: "remarketing", label: "Remarketing", color: "text-pink-400" },
  { key: "perdidos", label: "Perdido", color: "text-red-400" },
] as const;

export function PipelineAndNichos({ data }: { data: DashboardData }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Pipeline de Leads */}
      <div className="lg:col-span-3 bg-card rounded-xl p-6 card-hover border border-border">
        <h3 className="font-semibold text-foreground mb-6">Pipeline de Leads</h3>
        {data.totalLeads === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Crosshair className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Nenhum lead ainda. Inicie uma prospecção!
            </p>
            <Button className="gap-2" onClick={() => navigate("/prospeccao")}>
              <Crosshair className="h-4 w-4" /> Iniciar Prospecção
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {statusConfig.map((s) => {
              const count = data[s.key as keyof DashboardData] as number;
              return (
                <div key={s.key} className="text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{count}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Nichos */}
      <div className="lg:col-span-2 bg-card rounded-xl p-6 card-hover border border-border">
        <h3 className="font-semibold text-foreground mb-6">Top Nichos</h3>
        {data.topNiches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-info/10 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-info" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Prospecte para ver os nichos mais populares
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.topNiches.map((n, i) => (
              <div key={n.niche} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <span className="text-sm text-foreground flex-1">{n.niche}</span>
                <span className="text-sm font-semibold text-muted-foreground">{n.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
