import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Users, BarChart3, Zap, ExternalLink, Bookmark, Filter, Loader2, DollarSign, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface Opportunity {
  id: string;
  title: string;
  description: string;
  budget: string;
  location: string;
  source: string;
  postedAt: string;
  category: string;
  urgent: boolean;
  highValue: boolean;
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  { id: "1", title: "Desenvolvimento de App de Delivery", description: "Preciso de um app completo para delivery de comida com painel admin, pagamento integrado e rastreamento.", budget: "R$ 8.000 - R$ 15.000", location: "Remoto", source: "99freelas", postedAt: "2h atrás", category: "App Mobile", urgent: true, highValue: true },
  { id: "2", title: "Landing Page para Infoproduto", description: "LP de alta conversão para curso online sobre marketing digital. Precisa de VSL, depoimentos e checkout.", budget: "R$ 2.000 - R$ 4.000", location: "Remoto", source: "Workana", postedAt: "5h atrás", category: "Web", urgent: false, highValue: false },
  { id: "3", title: "Sistema de Agendamento para Clínica", description: "Sistema web com agendamento online, prontuário digital e gestão de pacientes.", budget: "R$ 12.000 - R$ 20.000", location: "São Paulo, SP", source: "99freelas", postedAt: "1 dia atrás", category: "Web", urgent: false, highValue: true },
  { id: "4", title: "E-commerce com Painel Admin", description: "Loja virtual completa com catálogo, carrinho, pagamento via PIX/cartão e dashboard de vendas.", budget: "R$ 6.000 - R$ 10.000", location: "Remoto", source: "Workana", postedAt: "3h atrás", category: "Web", urgent: true, highValue: true },
  { id: "5", title: "App para Barbearia com Agendamento", description: "Aplicativo simples para barbearia com agendamento, galeria de cortes e fidelidade.", budget: "R$ 3.000 - R$ 5.000", location: "Curitiba, PR", source: "Freelancer.com", postedAt: "6h atrás", category: "App Mobile", urgent: false, highValue: false },
  { id: "6", title: "Redesign de Site Institucional", description: "Modernizar site de escritório de advocacia. Precisa ser responsivo e otimizado para SEO.", budget: "R$ 2.500 - R$ 4.500", location: "Remoto", source: "99freelas", postedAt: "12h atrás", category: "Web", urgent: false, highValue: false },
];

const SOURCES = ["Todos", "99freelas", "Workana", "Freelancer.com"];
const CATEGORIES = ["Todos", "App Mobile", "Web", "Design", "Marketing"];

export default function ProspectorServicos() {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("Todos");
  const [category, setCategory] = useState("Todos");
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(MOCK_OPPORTUNITIES);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      setOpportunities(MOCK_OPPORTUNITIES.filter((o) => {
        if (search && !o.title.toLowerCase().includes(search.toLowerCase()) && !o.description.toLowerCase().includes(search.toLowerCase())) return false;
        if (source !== "Todos" && o.source !== source) return false;
        if (category !== "Todos" && o.category !== category) return false;
        return true;
      }));
      setLoading(false);
    }, 800);
  };

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast.info("Removido dos salvos"); }
      else { next.add(id); toast.success("Oportunidade salva!"); }
      return next;
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prospector de Serviços</h1>
          <p className="text-sm text-muted-foreground mt-1">Encontre oportunidades de projetos em tempo real</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Search, label: "Oportunidades", value: opportunities.length.toString(), color: "text-primary" },
            { icon: DollarSign, label: "Alto Valor", value: opportunities.filter((o) => o.highValue).length.toString(), color: "text-[hsl(var(--success))]" },
            { icon: Zap, label: "Urgentes", value: opportunities.filter((o) => o.urgent).length.toString(), color: "text-[hsl(var(--warning))]" },
            { icon: Bookmark, label: "Salvas", value: saved.size.toString(), color: "text-[hsl(var(--info))]" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar oportunidade..." className="pl-9 bg-card border-border" />
          </div>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground">
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <Button onClick={handleSearch} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />} Filtrar
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {opportunities.map((opp, i) => (
            <motion.div key={opp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border border-border p-5 card-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-foreground">{opp.title}</h3>
                    {opp.urgent && <span className="text-[10px] font-bold bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">Urgente</span>}
                    {opp.highValue && <span className="text-[10px] font-bold bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] px-1.5 py-0.5 rounded">Alto Valor</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{opp.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {opp.budget}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {opp.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {opp.postedAt}</span>
                    <span className="bg-secondary px-1.5 py-0.5 rounded">{opp.source}</span>
                    <span className="bg-secondary px-1.5 py-0.5 rounded">{opp.category}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="gap-1 border-border text-xs"><ExternalLink className="h-3 w-3" /> Ver</Button>
                  <Button variant={saved.has(opp.id) ? "default" : "outline"} size="sm" onClick={() => toggleSave(opp.id)} className="gap-1 border-border text-xs">
                    <Bookmark className={`h-3 w-3 ${saved.has(opp.id) ? "fill-current" : ""}`} /> {saved.has(opp.id) ? "Salvo" : "Salvar"}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
