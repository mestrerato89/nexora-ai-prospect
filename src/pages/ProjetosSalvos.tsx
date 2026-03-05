import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FolderOpen, Grid3X3, List, Search, Smartphone, Globe, Trash2, Copy, Eye, MoreVertical, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface Project {
  id: string;
  name: string;
  type: string;
  niche: string | null;
  description: string | null;
  status: string;
  prompt: string | null;
  features: string[];
  tags: string[];
  version: string;
  created_at: string;
  updated_at: string;
}

export default function ProjetosSalvos() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "app" | "site">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [preview, setPreview] = useState<Project | null>(null);

  const fetchProjects = async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("projects" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setProjects((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, [user]);

  const deleteProject = async (id: string) => {
    await supabase.from("projects" as any).delete().eq("id", id);
    toast.success("Projeto excluído");
    fetchProjects();
  };

  const filtered = projects.filter((p) => {
    if (filterType !== "all" && p.type !== filterType) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusColors: Record<string, string> = {
    rascunho: "bg-muted text-muted-foreground",
    em_desenvolvimento: "bg-primary/20 text-primary",
    concluido: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]",
    arquivado: "bg-secondary text-muted-foreground",
  };

  const statusLabels: Record<string, string> = {
    rascunho: "Rascunho",
    em_desenvolvimento: "Em Desenvolvimento",
    concluido: "Concluído",
    arquivado: "Arquivado",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-primary" /> Projetos Salvos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{projects.length} projeto(s)</p>
          </div>
          <div className="flex gap-2">
            <Button variant={view === "grid" ? "default" : "outline"} size="icon" onClick={() => setView("grid")} className="border-border"><Grid3X3 className="h-4 w-4" /></Button>
            <Button variant={view === "list" ? "default" : "outline"} size="icon" onClick={() => setView("list")} className="border-border"><List className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar projeto..." className="pl-9 bg-card border-border" />
          </div>
          <div className="flex gap-2">
            {(["all", "app", "site"] as const).map((t) => (
              <Button key={t} variant={filterType === t ? "default" : "outline"} size="sm" onClick={() => setFilterType(t)} className="border-border">
                {t === "all" ? "Todos" : t === "app" ? "Apps" : "Sites"}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            {["all", "rascunho", "em_desenvolvimento", "concluido"].map((s) => (
              <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)} className="border-border text-xs">
                {s === "all" ? "Todos Status" : statusLabels[s] || s}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum projeto encontrado</h3>
            <p className="text-sm text-muted-foreground">Crie um app ou site para começar.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-5 card-hover group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {p.type === "app" ? <Smartphone className="h-5 w-5 text-primary" /> : <Globe className="h-5 w-5 text-primary" />}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status] || statusColors.rascunho}`}>
                    {statusLabels[p.status] || p.status}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-1 truncate">{p.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {p.niche} • {p.version} • {format(new Date(p.created_at), "dd MMM yyyy", { locale: ptBR })}
                </p>
                {p.features?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.features.slice(0, 3).map((f) => (
                      <span key={f} className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{f}</span>
                    ))}
                    {p.features.length > 3 && <span className="text-[10px] text-muted-foreground">+{p.features.length - 3}</span>}
                  </div>
                )}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" onClick={() => setPreview(p)} className="flex-1 gap-1 border-border text-xs"><Eye className="h-3 w-3" /> Ver</Button>
                  <Button variant="outline" size="sm" onClick={() => { if (p.prompt) { navigator.clipboard.writeText(p.prompt); toast.success("Copiado!"); } }} className="gap-1 border-border text-xs"><Copy className="h-3 w-3" /></Button>
                  <Button variant="outline" size="sm" onClick={() => deleteProject(p.id)} className="gap-1 border-destructive/50 text-destructive text-xs"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Data</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="p-3 font-medium text-foreground">{p.name}</td>
                    <td className="p-3 text-muted-foreground capitalize">{p.type}</td>
                    <td className="p-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status] || ""}`}>{statusLabels[p.status] || p.status}</span></td>
                    <td className="p-3 text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}</td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setPreview(p)}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteProject(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={!!preview} onOpenChange={(o) => { if (!o) setPreview(null); }}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {preview?.type === "app" ? <Smartphone className="h-5 w-5 text-primary" /> : <Globe className="h-5 w-5 text-primary" />}
              {preview?.name}
            </DialogTitle>
          </DialogHeader>
          {preview?.prompt && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(preview.prompt!); toast.success("Copiado!"); }} className="gap-1 border-border"><Copy className="h-3 w-3" /> Copiar Prompt</Button>
              </div>
              <div className="bg-secondary rounded-lg p-4 max-h-[500px] overflow-y-auto text-sm">
                <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{preview.prompt}</ReactMarkdown></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
