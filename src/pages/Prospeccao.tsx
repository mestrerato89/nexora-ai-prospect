import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Crosshair, Search, Loader2, Save, Wifi, ShieldCheck, MapPin, Instagram, Facebook, ShoppingBag, Sparkles, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SearchFilters } from "@/components/prospeccao/SearchFilters";
import { ProspectCard } from "@/components/prospeccao/ProspectCard";
import { searchProspects, type ProspectResult, type SearchSource } from "@/lib/api/prospect";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type SearchStatus = "idle" | "searching" | "enriching" | "done" | "error";
type ProspectionSource = "google_maps" | "instagram" | "facebook" | "marketplace" | "enriquecer" | "validar";

const sourceTabs: { id: ProspectionSource; label: string; sublabel: string; icon: any; active: boolean }[] = [
  { id: "google_maps", label: "Leads Locais", sublabel: "Google Maps", icon: MapPin, active: true },
  { id: "instagram", label: "Instagram", sublabel: "Hashtag/Local", icon: Instagram, active: false },
  { id: "facebook", label: "Facebook", sublabel: "Páginas/Negócios", icon: Facebook, active: false },
  { id: "marketplace", label: "Marketplace", sublabel: "Em breve", icon: ShoppingBag, active: false },
  { id: "enriquecer", label: "Enriquecer", sublabel: "Site → Email", icon: Sparkles, active: false },
  { id: "validar", label: "Validar", sublabel: "Limpar base", icon: CheckCircle, active: false },
];

export default function Prospeccao() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeSource, setActiveSource] = useState<ProspectionSource>("google_maps");
  const [niche, setNiche] = useState(searchParams.get("niche") || "");
  const [location, setLocation] = useState(searchParams.get("city") || "");
  const [maxResults, setMaxResults] = useState("20");
  const [minRating, setMinRating] = useState("0");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<ProspectResult[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [source, setSource] = useState<SearchSource | null>(null);
  const [statusLabel, setStatusLabel] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche || !location) return;

    setStatus("searching");
    setResults([]);
    setProgress(10);
    setSource(null);
    setStatusLabel("Conectando...");

    try {
      const response = await searchProspects(
        { niche, location, maxResults: parseInt(maxResults), minRating: parseFloat(minRating) },
        (partial, label) => {
          if (partial.length > 0) setResults(partial);
          setStatusLabel(label);
          const max = parseInt(maxResults);
          setProgress(Math.min(10 + (partial.length / max) * 80, 90));
        }
      );

      setSource(response.source);

      if (user) {
        await supabase.from("prospections").insert({
          user_id: user.id, niche, location,
          status: "completed", leads_found: response.results.length,
        });
      }

      setResults(response.results);
      setProgress(100);
      setStatus("done");

      const sourceLabel =
        response.source === "google" ? "Google API Pro (Oficial)" :
          response.source === "scraper" ? "Buscador Local (Gratuito)" :
            "IA Gemini (Backup)";
      toast.success(`${response.results.length} empresas via ${sourceLabel}!`);
    } catch (err: any) {
      setStatus("error");
      setProgress(0);
      toast.error(err.message || "Erro ao buscar empresas");
    }
  };

  const saveLead = async (result: ProspectResult) => {

    const { error } = await supabase.from("leads").insert({
      user_id: null,
      status: "novo",
      name: result.name, address: result.address,
      phone: result.phone || null, website: result.website || null,
      rating: result.rating, niche, city: location,
      has_phone: !!result.phone, has_website: !!result.website, score: result.score,
    } as any);

    if (error) {
      toast.error(error.message || "Erro ao salvar lead");
      return false;
    }

    setSaved((prev) => new Set([...prev, result.id]));
    toast.success(`${result.name} salvo no CRM!`);
    return true;
  };

  const saveAll = async () => {

    const unsaved = results.filter((r) => !saved.has(r.id));
    if (unsaved.length === 0) {
      toast.info("Todos já foram salvos");
      return;
    }

    let savedCount = 0;
    for (const r of unsaved) {
      const ok = await saveLead(r);
      if (ok) savedCount += 1;
    }

    if (savedCount > 0) {
      toast.success(`${savedCount} leads salvos!`);
    }
  };

  const loading = status === "searching" || status === "enriching";

  const sourceInfo = source === "google"
    ? { icon: ShieldCheck, label: "Google Business API — Dados Oficiais", className: "text-primary font-bold" }
    : source === "scraper"
      ? { icon: Wifi, label: "Google Maps (Buscador Local)", className: "text-primary" }
      : source === "ai"
        ? { icon: Search, label: "Resultados via IA — Recomendamos verificar os dados", className: "text-muted-foreground italic" }
        : null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        <div>
          <h1 className="text-xl font-mono font-bold text-foreground flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-primary" /> Encontrar Empresas
          </h1>
        </div>

        {/* Source Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {sourceTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.active) setActiveSource(tab.id);
                else toast.info(`${tab.label} — Em breve!`);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-kanban text-left transition-all shrink-0 border ${activeSource === tab.id
                ? 'bg-primary text-primary-foreground border-primary'
                : tab.active
                  ? 'bg-card border-primary/5 hover:border-primary/20 text-muted-foreground hover:text-foreground'
                  : 'bg-card/50 border-primary/5 text-muted-foreground/50 cursor-default'
                }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <div>
                <p className={`text-xs font-semibold leading-tight ${activeSource === tab.id ? '' : ''}`}>{tab.label}</p>
                <p className={`text-[9px] font-mono leading-tight ${activeSource === tab.id ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>{tab.sublabel}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeSource === "google_maps" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SearchFilters
              niche={niche} location={location} maxResults={maxResults} minRating={minRating}
              loading={loading} onNicheChange={setNiche} onLocationChange={setLocation}
              onMaxResultsChange={setMaxResults} onMinRatingChange={setMinRating} onSubmit={handleSearch}
            />

            <div className="lg:col-span-2 space-y-4">
              {loading && (
                <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    {statusLabel}
                  </div>
                  <Progress value={progress} className="h-2" />
                  {results.length > 0 && (
                    <p className="text-xs text-muted-foreground">{results.length} resultados parciais</p>
                  )}
                </div>
              )}

              {sourceInfo && status === "done" && (
                <div className={`flex items-center gap-2 text-sm ${sourceInfo.className}`}>
                  <sourceInfo.icon className="h-4 w-4" />
                  {sourceInfo.label}
                </div>
              )}

              {results.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {results.length} resultados • Score médio: {Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)}
                  </p>
                  <Button variant="outline" size="sm" className="gap-2 border-border" onClick={saveAll}>
                    <Save className="h-3.5 w-3.5" /> Salvar Todos
                  </Button>
                </div>
              )}

              <AnimatePresence>
                {results.length === 0 && !loading && status !== "error" && (
                  <div className="bg-card rounded-xl border border-border p-12 text-center">
                    <Search className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-1">Selecione nicho e cidade</h3>
                    <p className="text-sm text-muted-foreground">
                      Preencha os filtros e clique em buscar para encontrar empresas
                    </p>
                  </div>
                )}

                {status === "error" && results.length === 0 && (
                  <div className="bg-card rounded-xl border border-destructive/30 p-12 text-center">
                    <h3 className="font-semibold text-destructive mb-1">Erro na busca</h3>
                    <p className="text-sm text-muted-foreground">Tente novamente em alguns instantes</p>
                  </div>
                )}

                {results.map((r) => (
                  <ProspectCard key={r.id} result={r} saved={saved.has(r.id)} canSave={!!user} onSave={() => saveLead(r)} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-20 text-center">
            <h3 className="font-mono font-bold text-foreground uppercase tracking-widest mb-2">Módulo em Desenvolvimento</h3>
            <p className="text-sm text-muted-foreground">Esta fonte de prospecção estará disponível em breve na sua estação.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
