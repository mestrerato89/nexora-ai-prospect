import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Smartphone, Copy, Loader2, ArrowLeft, ArrowRight, Check, Download, Save, Sparkles, Search, LayoutGrid, UtensilsCrossed, Calendar, ShoppingBag, BarChart3, Heart, PartyPopper, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

import imgAcaiteria from "@/assets/niches/acaiteria.jpg";
import imgPizzaria from "@/assets/niches/pizzaria.jpg";
import imgHamburgueria from "@/assets/niches/hamburgueria.jpg";
import imgPastelaria from "@/assets/niches/pastelaria.jpg";
import imgRestaurante from "@/assets/niches/restaurante.jpg";
import imgCafeteria from "@/assets/niches/cafeteria.jpg";
import imgSorveteria from "@/assets/niches/sorveteria.jpg";
import imgMarmitaria from "@/assets/niches/marmitaria.jpg";
import imgBarbearia from "@/assets/niches/barbearia.jpg";
import imgSalao from "@/assets/niches/salao.jpg";
import imgClinica from "@/assets/niches/clinica.jpg";
import imgAcademia from "@/assets/niches/academia.jpg";

const NICHOS = [
  { id: "acaiteria", title: "Açaiteria", emoji: "🍇", img: imgAcaiteria, category: "delivery", features: ["Cardápio digital", "Pedidos online", "Programa de fidelidade", "Avaliações"] },
  { id: "pizzaria", title: "Pizzaria", emoji: "🍕", img: imgPizzaria, category: "delivery", features: ["Cardápio digital", "Delivery", "Reservas de mesa", "Programa de fidelidade"] },
  { id: "hamburgueria", title: "Hamburgueria", emoji: "🍔", img: imgHamburgueria, category: "delivery", features: ["Cardápio digital", "Pedidos online", "Combos promocionais", "Avaliações"] },
  { id: "pastelaria", title: "Pastelaria", emoji: "🥟", img: imgPastelaria, category: "delivery", features: ["Cardápio digital", "Pedidos online", "Delivery", "Fidelidade"] },
  { id: "restaurante", title: "Restaurante", emoji: "🍽️", img: imgRestaurante, category: "delivery", features: ["Cardápio digital", "Reservas", "Delivery", "Chat com suporte"] },
  { id: "cafeteria", title: "Cafeteria", emoji: "☕", img: imgCafeteria, category: "delivery", features: ["Cardápio digital", "Programa de fidelidade", "Pedidos online", "WiFi social"] },
  { id: "sorveteria", title: "Sorveteria", emoji: "🍦", img: imgSorveteria, category: "delivery", features: ["Cardápio digital", "Sabores do dia", "Fidelidade", "Pedidos online"] },
  { id: "marmitaria", title: "Marmitaria", emoji: "🍱", img: imgMarmitaria, category: "delivery", features: ["Cardápio semanal", "Assinatura mensal", "Delivery", "Pagamento online"] },
  { id: "barbearia", title: "Barbearia", emoji: "✂️", img: imgBarbearia, category: "agendamento", features: ["Agendamento online", "Catálogo de serviços", "Programa de fidelidade", "Avaliações"] },
  { id: "salao", title: "Salão de Beleza", emoji: "💇‍♀️", img: imgSalao, category: "agendamento", features: ["Agendamento online", "Catálogo", "Fidelidade", "Chat"] },
  { id: "clinica", title: "Clínica / Saúde", emoji: "🏥", img: imgClinica, category: "saude", features: ["Agendamento", "Prontuário digital", "Lembretes", "Teleconsulta"] },
  { id: "academia", title: "Academia", emoji: "🏋️", img: imgAcademia, category: "saude", features: ["Check-in digital", "Planos de treino", "Agendamento de aulas", "Pagamento recorrente"] },
];

const CATEGORIES = [
  { id: "todos", label: "Todos", icon: LayoutGrid },
  { id: "delivery", label: "Delivery", icon: UtensilsCrossed },
  { id: "agendamento", label: "Agendamento", icon: Calendar },
  { id: "saude", label: "Saúde", icon: Heart },
];

const ALL_FEATURES = [
  "Cardápio digital", "Pedidos online", "Sistema de entregas", "Programa de fidelidade",
  "Avaliações de clientes", "Chat com suporte", "Pagamento online", "Reservas de mesa",
  "Agendamento online", "Push notifications", "Analytics", "Integração WhatsApp",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rataria-chat`;

export default function NovoApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedNiche, setSelectedNiche] = useState<typeof NICHOS[0] | null>(null);
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [primaryColor, setPrimaryColor] = useState("#4F46E5");
  const [features, setFeatures] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [genStep, setGenStep] = useState("");
  const [saving, setSaving] = useState(false);
  const [nicheFilter, setNicheFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");

  const toggleFeature = (f: string) =>
    setFeatures((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  const selectNiche = (n: typeof NICHOS[0]) => {
    setSelectedNiche(n);
    setFeatures(n.features);
    setAppName("");
    setDescription("");
    setStep(1);
  };

  const handleGenerate = async () => {
    setStep(2);
    setGenerating(true);
    setGeneratedPrompt("");

    const steps = ["Analisando nicho...", "Gerando arquitetura...", "Criando prompts...", "Finalizando..."];
    for (const s of steps) {
      setGenStep(s);
      await new Promise((r) => setTimeout(r, 800));
    }

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Gere um prompt técnico completo e detalhado para criar um aplicativo mobile-first para o nicho "${selectedNiche?.title}".

Nome do app: ${appName || selectedNiche?.title}
Descrição: ${description || "Aplicativo padrão para o nicho"}
Tema: ${theme === "light" ? "Claro" : "Escuro"}
Cor primária: ${primaryColor}
Funcionalidades: ${features.join(", ")}

O prompt deve incluir:
1. Visão geral do projeto
2. Lista detalhada de telas e funcionalidades
3. Estrutura de dados sugerida
4. Sugestões de UI/UX
5. Integrações recomendadas
6. Requisitos técnicos

Formato: Markdown bem estruturado, pronto para ser usado como especificação técnica.`
          }],
        }),
      });

      if (!resp.ok) throw new Error("Erro na API");

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let textBuffer = "";
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              result += content;
              setGeneratedPrompt(result);
            }
          } catch { break; }
        }
      }

      setGenStep("Concluído!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar prompt");
      setGenStep("Erro na geração");
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("projects" as any).insert({
      user_id: user.id,
      name: appName || selectedNiche?.title || "Novo App",
      type: "app",
      niche: selectedNiche?.id,
      description,
      theme,
      primary_color: primaryColor,
      features,
      prompt: generatedPrompt,
      status: "rascunho",
    });
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Projeto salvo com sucesso!");
      navigate("/projetos-salvos");
    }
    setSaving(false);
  };

  const filteredNichos = NICHOS.filter((n) => {
    const matchSearch = !nicheFilter || n.title.toLowerCase().includes(nicheFilter.toLowerCase());
    const matchCategory = categoryFilter === "todos" || n.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const stepLabels = ["Selecionar Nicho", "Personalizar", "Gerar com IA", "Salvar"];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1100px]">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" /> Novo Aplicativo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Crie um app completo com IA em 4 etapas</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30" :
                "bg-secondary text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block truncate">{label}</span>
              {i < 3 && <div className={`h-0.5 flex-1 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 0: Catalog */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Catálogo de Modelos</h2>
                <p className="text-sm text-muted-foreground">Selecione um nicho para personalizar e gerar o prompt</p>
              </div>

              {/* Category tabs */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = categoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar modelo..."
                  value={nicheFilter}
                  onChange={(e) => setNicheFilter(e.target.value)}
                  className="bg-card border-border pl-10"
                />
              </div>

              {/* Image grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNichos.map((nicho) => (
                  <motion.button
                    key={nicho.id}
                    onClick={() => selectNiche(nicho)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative group rounded-xl overflow-hidden aspect-[4/3] border border-border"
                  >
                    <img
                      src={nicho.img}
                      alt={nicho.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-lg text-left">{nicho.title}</h3>
                    </div>
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary rounded-xl transition-colors" />
                  </motion.button>
                ))}
              </div>

              {filteredNichos.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum modelo encontrado</p>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 1: Customization */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div className="bg-card rounded-xl border border-border p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-14 w-14 rounded-xl overflow-hidden">
                    <img src={selectedNiche?.img} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedNiche?.title}</h2>
                    <p className="text-xs text-muted-foreground">Personalize seu aplicativo</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <Label>Nome do aplicativo</Label>
                      <Input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder={`Meu ${selectedNiche?.title}`} className="bg-secondary border-border" />
                    </div>
                    <div>
                      <Label>Descrição do negócio</Label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva brevemente o negócio e público-alvo..."
                        className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-24"
                      />
                    </div>
                    <div>
                      <Label>Tema</Label>
                      <div className="flex gap-2 mt-1">
                        <Button variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")} className="flex-1">☀️ Claro</Button>
                        <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")} className="flex-1">🌙 Escuro</Button>
                      </div>
                    </div>
                    <div>
                      <Label>Cor primária</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-12 rounded border-0 cursor-pointer" />
                        <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="bg-secondary border-border flex-1" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Funcionalidades</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {ALL_FEATURES.map((f) => (
                        <label key={f} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                          <Checkbox checked={features.includes(f)} onCheckedChange={() => toggleFeature(f)} />
                          {f}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="gap-2 border-border">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handleGenerate} className="gap-2 flex-1">
                  <Sparkles className="h-4 w-4" /> Gerar com IA
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: AI Generation */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              {generating && (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-semibold text-foreground">{genStep}</p>
                  <p className="text-sm text-muted-foreground mt-1">Gerando seu app personalizado...</p>
                </div>
              )}

              {generatedPrompt && (
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-foreground">Prompt Gerado</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(generatedPrompt); toast.success("Copiado!"); }} className="gap-1 border-border">
                        <Copy className="h-3 w-3" /> Copiar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        const blob = new Blob([generatedPrompt], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = `${appName || "app"}-prompt.txt`; a.click();
                      }} className="gap-1 border-border">
                        <Download className="h-3 w-3" /> .txt
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto bg-secondary rounded-lg p-4 text-sm">
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{generatedPrompt}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {!generating && generatedPrompt && (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setGeneratedPrompt(""); handleGenerate(); }} className="gap-2 border-border">
                    <Sparkles className="h-4 w-4" /> Gerar Novamente
                  </Button>
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2 border-border">
                    <ArrowLeft className="h-4 w-4" /> Editar
                  </Button>
                  <Button onClick={() => setStep(3)} className="gap-2 flex-1">
                    Salvar Projeto <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: Save */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div className="bg-card rounded-xl border border-border p-8 text-center space-y-4 max-w-md mx-auto">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Projeto pronto!</h2>
                <p className="text-sm text-muted-foreground">
                  "{appName || selectedNiche?.title}" — {features.length} funcionalidades
                </p>

                <div className="space-y-3 pt-4">
                  <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar em Meus Projetos
                  </Button>
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(generatedPrompt); toast.success("Prompt copiado!"); }} className="w-full gap-2 border-border">
                    <Copy className="h-4 w-4" /> Copiar Prompt
                  </Button>
                  <Button variant="ghost" onClick={() => setStep(2)} className="w-full gap-2 text-muted-foreground">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
