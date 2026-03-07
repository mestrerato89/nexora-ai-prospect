import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign } from "lucide-react";

interface Props {
  data: { date: string; count: number }[];
  viewMode?: 'month' | 'year' | 'range';
}

export function PerformanceChart({ data, viewMode = 'month' }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0);

  const formatDate = (v: string) => {
    if (!v) return "";
    if (viewMode === 'year') {
      // v is yyyy-MM
      const [year, month] = v.split('-');
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return monthNames[parseInt(month) - 1];
    }
    // v is yyyy-MM-dd
    return v.slice(8) + "/" + v.slice(5, 7);
  };

  return (
    <div className="bg-card/40 backdrop-blur-xl rounded-[2rem] p-6 border border-primary/10 h-full shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-xl">
            <DollarSign className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-black text-foreground uppercase tracking-widest text-xs">Vendas Realizadas</h3>
            <p className="text-[10px] text-muted-foreground font-mono">{total} conversões no período</p>
          </div>
        </div>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgb(249, 115, 22)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="rgb(249, 115, 22)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary)/0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
              tickFormatter={formatDate}
              axisLine={false}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={20}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--primary)/0.1)",
                borderRadius: 16,
                fontSize: 10,
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
              labelFormatter={(v) => `Data: ${v}`}
              cursor={{ stroke: 'rgba(249, 115, 22, 0.2)', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="rgb(249, 115, 22)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSales)"
              name="Vendas"
              animationBegin={0}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
