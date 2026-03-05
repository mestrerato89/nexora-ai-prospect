import { Users, Flame, Clock, UserCheck, TrendingUp, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardData } from "@/pages/Index";

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;
}

function StatCard({ icon: Icon, iconColor, label, value }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl p-4 card-hover border border-border">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-3 ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export function StatsRow({ data }: { data: DashboardData }) {
  const stats: StatCardProps[] = [
    { icon: Users, iconColor: "bg-primary/20 text-primary", label: "Total de Leads", value: String(data.totalLeads) },
    { icon: Flame, iconColor: "bg-[hsl(var(--stat-icon-orange))]/20 text-[hsl(var(--stat-icon-orange))]", label: "Leads Quentes", value: String(data.leadsQuentes) },
    { icon: Clock, iconColor: "bg-info/20 text-info", label: "Contatados", value: String(data.contatados) },
    { icon: UserCheck, iconColor: "bg-primary/20 text-primary", label: "Fechados", value: String(data.fechados) },
    { icon: TrendingUp, iconColor: "bg-[hsl(var(--stat-icon-purple))]/20 text-[hsl(var(--stat-icon-purple))]", label: "Pipeline", value: `R$0k` },
    { icon: Star, iconColor: "bg-[hsl(var(--stat-icon-yellow))]/20 text-[hsl(var(--stat-icon-yellow))]", label: "Prev. Receita", value: `R$0k` },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
