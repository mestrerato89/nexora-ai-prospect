import { TrendingUp, Bell, Phone, Globe, Star, Flame, CloudSnow, Snowflake } from "lucide-react";
import type { DashboardData } from "@/pages/Index";

export function MetricsGrid({ data }: { data: DashboardData }) {
  const convRate = data.totalLeads > 0
    ? Math.round((data.pagos / data.totalLeads) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Taxa de Conversão */}
      <div className="bg-card rounded-xl p-6 card-hover border border-border">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Taxa de Conversão</h3>
        </div>
        <p className="text-4xl font-bold text-primary">{convRate}%</p>
        <p className="text-sm text-muted-foreground mt-1">{data.totalLeads} leads em andamento</p>
        <div className="mt-4 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${convRate}%` }} />
        </div>
      </div>

      {/* Qualidade dos Dados */}
      <div className="bg-card rounded-xl p-6 card-hover border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-warning" />
          <h3 className="font-semibold text-foreground">Qualidade dos Dados</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" /><span>Com telefone</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{data.withPhone} / {data.totalLeads}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" /><span>Com website</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{data.withWebsite} / {data.totalLeads}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4" /><span>Avaliação média</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{data.avgRating}</span>
          </div>
        </div>
      </div>

      {/* Follow-ups */}
      <div className="bg-card rounded-xl p-6 card-hover border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-info" />
          <h3 className="font-semibold text-foreground">Follow-ups</h3>
        </div>
        <p className="text-4xl font-bold text-foreground">{data.pendingFollowUps}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {data.overdueFollowUps > 0 ? `${data.overdueFollowUps} atrasados` : "pendentes/atrasados"}
        </p>
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-[hsl(var(--stat-icon-orange))]" /> {data.contatados} quentes
          </span>
          <span className="flex items-center gap-1">
            <CloudSnow className="h-3 w-3 text-warning" /> 0 mornos
          </span>
          <span className="flex items-center gap-1">
            <Snowflake className="h-3 w-3 text-info" /> 0 frios
          </span>
        </div>
      </div>
    </div>
  );
}
