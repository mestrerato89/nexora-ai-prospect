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
import { Globe, Copy, Loader2, ArrowLeft, ArrowRight, Check, Download, Save, Sparkles, Search, LayoutGrid, Monitor, Briefcase, ShoppingBag, Building2, Palette, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

import imgInfoproduto from "@/assets/sites/infoproduto.jpg";
import imgCursoOnline from "@/assets/sites/curso-online.jpg";
import imgSaas from "@/assets/sites/saas.jpg";
import imgEbook from "@/assets/sites/ebook.jpg";
import imgMembership from "@/assets/sites/membership.jpg";
import imgMentoria from "@/assets/sites/mentoria.jpg";
import imgConsultoria from "@/assets/sites/consultoria.jpg";
import imgEcommerce from "@/assets/sites/ecommerce.jpg";
import imgBarbearia from "@/assets/sites/barbearia.jpg";
import imgRestaurante from "@/assets/sites/restaurante.jpg";
import imgClinica from "@/assets/sites/clinica.jpg";
import imgImobiliaria from "@/assets/sites/imobiliaria.jpg";
import imgAdvocacia from "@/assets/sites/advocacia.jpg";
import imgServicoLocal from "@/assets/sites/servico-local.jpg";
import imgCoaching from "@/assets/sites/coaching.jpg";

const NICHOS = [
  { id: "infoproduto", title: "Infoproduto / Curso Digital", img: imgInfoproduto, category: "produto-digital", sections: ["Hero", "Benefícios", "Depoimentos", "Pricing", "FAQ"] },
  { id: "curso-online", title: "Curso Online com Módulos", img: imgCursoOnline, category: "produto-digital", sections: ["Hero", "Módulos", "Instrutor", "Depoimentos", "FAQ", "CTA"] },
  { id: "saas", title: "SaaS / Plataforma", img: imgSaas, category: "produto-digital", sections: ["Hero", "Features", "Pricing", "Depoimentos", "FAQ"] },
  { id: "ebook", title: "E-book / Material Digital", img: imgEbook, category: "produto-digital", sections: ["Hero", "Conteúdo", "Autor", "Depoimentos", "CTA"] },
  { id: "membership", title: "Membership / Assinatura", img: imgMembership, category: "produto-digital", sections: ["Hero", "Benefícios", "Pricing", "FAQ", "Contato"] },
  { id: "mentoria", title: "Mentoria High-Ticket", img: imgMentoria, category: "servico-mentoria", sections: ["Hero VSL", "Resultados", "Depoimentos", "FAQ", "CTA"] },
  { id: "consultoria", title: "Consultoria Online", img: imgConsultoria, category: "servico-mentoria", sections: ["Hero", "Serviços", "Cases", "Sobre", "Contato"] },
  { id: "coaching", title: "Coaching / Programa de Transformação", img: imgCoaching, category: "servico-mentoria", sections: ["Hero VSL", "Transformação", "Depoimentos", "FAQ", "CTA"] },
  { id: "servico-local", title: "Serviço Local / Autônomo", img: imgServicoLocal, category: "servico-mentoria", sections: ["Hero", "Serviços", "Galeria", "Depoimentos", "Contato"] },
  { id: "ecommerce", title: "E-commerce / Loja Virtual", img: imgEcommerce, category: "produto-fisico", sections: ["Hero", "Produtos", "Categorias", "Depoimentos", "Footer"] },
  { id: "barbearia", title: "Barbearia", img: imgBarbearia, category: "site-institucional", sections: ["Hero", "Serviços", "Galeria", "Agendamento", "Contato"] },
  { id: "restaurante", title: "Restaurante", img: imgRestaurante, category: "site-institucional", sections: ["Hero", "Cardápio", "Galeria", "Reservas", "Contato"] },
  { id: "clinica", title: "Clínica / Saúde", img: imgClinica, category: "site-institucional", sections: ["Hero", "Serviços", "Equipe", "Depoimentos", "Contato"] },
  { id: "imobiliaria", title: "Imobiliária", img: imgImobiliaria, category: "site-institucional", sections: ["Hero", "Imóveis", "Busca", "Sobre", "Contato"] },
  { id: "advocacia", title: "Advocacia", img: imgAdvocacia, category: "site-institucional", sections: ["Hero", "Áreas de Atuação", "Equipe", "Blog", "Contato"] },
];

const CATEGORIES = [
  { id: "todos", label: "Todos", icon: LayoutGrid },
  { id: "produto-digital", label: "Produto Digital", icon: Monitor },
  { id: "servico-mentoria", label: "Serviço / Mentoria", icon: Briefcase },
  { id: "produto-fisico", label: "Produto Físico", icon: ShoppingBag },
  { id: "site-institucional", label: "Site Institucional", icon: Building2 },
  { id: "portfolio", label: "Portfólio", icon: Palette },
  { id: "captura", label: "Captura / Webinário", icon: Link2 },
];

const ALL_SECTIONS = [
  "Seção Hero", "Seção de Benefícios", "Seção de Depoimentos", "FAQ",
  "Countdown timer", "Formulário de captura", "Integração WhatsApp", "Vídeo de vendas",
  "Selo de garantia", "Chat ao vivo", "Blog", "Pricing/Planos",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rataria-chat`;

export default function NovoSite() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedNiche, setSelectedNiche] = useState<typeof NICHOS[0] | null>(null);
  const [siteName, setSiteName] = useState("");
  const [description, setDescription] = useState("");
  const [siteType, setSiteType] = useState("landing");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [primaryColor, setPrimaryColor] = useState("#4F46E5");
  const [sections, setSections] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [genStep, setGenStep] = useState("");
  const [saving, setSaving] = useState(false);
  const [nicheFilter, setNicheFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");

  // Premium Mode State
  const [magicPrompt, setMagicPrompt] = useState("");
  const [isMagicLoading, setIsMagicLoading] = useState(false);

  const toggleSection = (s: string) =>
    setSections((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const selectNiche = (n: typeof NICHOS[0]) => {
    setSelectedNiche(n);
    setSections(n.sections);
    setSiteName("");
    setDescription("");
    setStep(1);
  };

  const handleMagicFill = async () => {
    if (!magicPrompt.trim()) {
      toast.error("Cole o texto gerado pela IA primeiro");
      return;
    }

    setIsMagicLoading(true);
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
            content: `Você é um extrator de dados JSON. Extraia as informações do texto abaixo seguindo ESTRITAMENTE o formato JSON.
            
TEXTO:
${magicPrompt}

RESPONDA APENAS COM UM OBJETO JSON VÁLIDO (nada de marcação markdown) COM ESTE FORMATO EXATO:
{
  "nome": "Extraia o Nome do projeto",
  "descricao": "Combine 'O que faz', 'Para quem', e 'Sensação desejada' em um parágrafo conciso",
  "tema": "light ou dark baseado na resposta (se ambos, escolha o que fizer mais sentido)",
  "keywords": "3 a 5 palavras-chave separadas por vírgula baseadas no nicho"
}`
          }],
        }),
      });

      if (!resp.ok) throw new Error("Erro na requisição");

      // Extract the full response
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("Sem resposta");

      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\\n');

        for (let line of lines) {
          if (line.endsWith('\\r')) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.choices?.[0]?.delta?.content) {
              fullResponse += data.choices[0].delta.content;
            }
          } catch (e) { }
        }
      }

      // Try to parse the extracted JSON
      const jsonStr = fullResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const extractedData = JSON.parse(jsonStr);

      if (extractedData.nome) setSiteName(extractedData.nome);
      if (extractedData.descricao) setDescription(extractedData.descricao);
      if (extractedData.tema) setTheme(extractedData.tema === 'dark' ? 'dark' : 'light');
      if (extractedData.keywords) setKeywords(extractedData.keywords);

      setMagicPrompt(""); // Clear after success
      toast.success("Campos preenchidos magicamente! ✨");

    } catch (error) {
      console.error("Error magic fill:", error);
      toast.error("Não foi possível extrair os dados. Tente preencher manualmente.");
    } finally {
      setIsMagicLoading(false);
    }
  };

  const handleGenerate = async () => {
    setStep(2);
    setGenerating(true);
    setGeneratedPrompt("");

    const steps = ["Analisando nicho...", "Definindo estrutura...", "Gerando conteúdo...", "Finalizando..."];
    for (const s of steps) { setGenStep(s); await new Promise((r) => setTimeout(r, 800)); }

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
            content: `Use the following data to generate a complete visual identity document following EXACTLY these rules.

DADOS DO PROJETO:
• Nome do projeto: ${siteName || selectedNiche?.title}
• O que faz e para quem: ${description || "Site padrão para o nicho"}
• Tipo da Página: ${siteType === "landing" ? "Landing Page de alta conversão" : "Site institucional completo"}
• Base do Tema: ${theme === "light" ? "Claro (Light Mode)" : "Escuro (Dark Mode)"}
• Cor da Marca (Accent): ${primaryColor}
• Seções escolhidas: ${sections.join(", ")}

INSTRUÇÕES DO PROMPT APLICÁVEL:

# CRIAÇÃO DE IDENTIDADE VISUAL A PARTIR DE REFERÊNCIAS

## O QUE ESTE PROMPT FAZ
Você vai criar uma identidade visual ORIGINAL para o app listado acima. Não é trocar cores de um template. É criar uma experiência visual que tenha ALMA — onde cada tela conta uma história e cada componente tem personalidade.

O resultado é um documento .md que funciona como "DNA visual" do projeto — qualquer IA que ler esse documento vai gerar interfaces com personalidade própria, não templates recoloridos.

## O PROBLEMA QUE ESTE PROMPT RESOLVE
Quando você pede pra uma IA criar uma interface, ela entrega o DEFAULT: Sidebar lateral + cards brancos vazios + tabela com headers + ícones Lucide soltos + Inter/Geist + sombra + rounded-lg + cores do Tailwind. Tudo flat, limpo, vazio.

O que falta não é decoração (evite dot grids, blobs, partículas genéricas). É CONCEITO VISUAL.

Um card de "Progresso" com um blob gradiente atrás do número = DECORADO, MAS SEM CONCEITO.
Um card de "Progresso" com uma rota de avião tracejada indo de um ponto a outro = CONCEITO (conta a história: "sua viagem está aqui").

## A REGRA DA COR ÚNICA
A identidade visual deve ter UMA base limpa (light OU dark) + UMA cor primária forte (Accent definida acima).
Todo o resto é neutro: cinzas, brancos, pretos. NUNCA criar arco-íris de categorias. Cores de status só para alertas.

## AS TRÊS CAMADAS DA IDENTIDADE
1. ESTRUTURA: Como a interface se organiza (Navegação, layout, hierarquia).
2. LINGUAGEM: Como se expressa (Tipografia, um accent forte, geometria, sombras).
3. RIQUEZA VISUAL: O nível essencial.
- Nível A (Textura Ambiente): Pattern geométrico sutil no background (opacity 3-5%).
- Nível B (Conceito Visual): Cada card importante deve ter uma ILUSTRAÇÃO CONCEITUAL usando SVG inline/CSS que conte uma história (Ex: uma grade organizando arquivos, cursores colaborando ao vivo, etc).

Gere o documento Markdown com a seguinte estrutura EXATA:

# IDENTIDADE VISUAL — ${siteName || selectedNiche?.title}

## Stack Técnica e Regras
(Listar regras Tailwind UI, shadcn, semântica de tokens, uma cor accent)

## A Alma do App
(2-3 frases firmes de personalidade)

## Decisões de Identidade
### ESTRUTURA
(Decisões específicas)
### LINGUAGEM
(Decisões tipográficas, de cor, de forma)
### RIQUEZA VISUAL
#### Textura Ambiente
(O pattern de fundo)
#### Conceitos Visuais por Componente
(Para cada componente das seções escolhidas - no mínimo 4 - defina: Representa, Metáfora visual, Cena detalhada, Viabilidade)

## Tokens de Design
(Cores Surface, Cores Texto, Cor Accent única e variações, Sombras, Geometria em formato de tabela)

## Regra de Ouro
A interface inteira usa base neutra + a cor primária da marca. Nenhuma outra cor vibrante.`
          }],
        }),
      });

      if (!resp.ok) throw new Error("Erro");
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let textBuffer = "", result = "";
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
          const j = line.slice(6).trim();
          if (j === "[DONE]") break;
          try {
            const p = JSON.parse(j);
            const c = p.choices?.[0]?.delta?.content;
            if (c) { result += c; setGeneratedPrompt(result); }
          } catch { break; }
        }
      }
      setGenStep("Concluído!");
    } catch { toast.error("Erro ao gerar prompt"); setGenStep("Erro"); }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("projects" as any).insert({
      user_id: user.id,
      name: siteName || selectedNiche?.title || "Novo Site",
      type: "site",
      niche: selectedNiche?.id,
      description,
      theme,
      primary_color: primaryColor,
      features: sections,
      prompt: generatedPrompt,
      status: "rascunho",
    });
    if (error) toast.error("Erro ao salvar: " + error.message);
    else { toast.success("Projeto salvo!"); navigate("/projetos-salvos"); }
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
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" /> Novo Site / Landing Page
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Crie um site de alta conversão com IA</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i < step ? "bg-primary text-primary-foreground" :
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
            <motion.div key="s0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Catálogo de Sites</h2>
                <p className="text-sm text-muted-foreground">Selecione um nicho para personalizar e gerar o prompt do seu site</p>
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
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
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
                  placeholder="Buscar modelo de site..."
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
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div className="bg-card rounded-xl border border-border p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-14 w-14 rounded-xl overflow-hidden">
                    <img src={selectedNiche?.img} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedNiche?.title}</h2>
                    <p className="text-xs text-muted-foreground">Personalize seu site</p>
                  </div>
                </div>

                {/* PREMIUM MODE AUTO-FILL */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Sparkles className="h-4 w-4" /> Modo Premium (Auto-preenchimento com IA)
                  </div>
                  <p className="text-xs text-muted-foreground">Cole as respostas geradas pela IA abaixo. Nós extrairemos o Nome, Descrição e Keywords automaticamente para você.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <textarea
                      value={magicPrompt}
                      onChange={(e) => setMagicPrompt(e.target.value)}
                      placeholder="Cole o texto aqui... (Ex: 'me ajude a responder essas perguntas para uma loja...')"
                      className="flex-1 rounded-lg bg-background border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none h-20"
                    />
                    <Button
                      onClick={handleMagicFill}
                      disabled={isMagicLoading || !magicPrompt.trim()}
                      className="sm:h-20 shrink-0 gap-2 whitespace-nowrap"
                    >
                      {isMagicLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {isMagicLoading ? "Analisando..." : "Preencher Formulário"}
                    </Button>
                  </div>
                </div>
                <div className="my-6 border-b border-border/50 relative">
                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-card px-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Ou preencha manualmente</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div><Label>Nome do site</Label><Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder={`Meu ${selectedNiche?.title}`} className="bg-secondary border-border" /></div>
                    <div><Label>Descrição</Label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o negócio..." className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-24" /></div>
                    <div>
                      <Label>Tipo de página</Label>
                      <div className="flex gap-2 mt-1">
                        <Button variant={siteType === "landing" ? "default" : "outline"} size="sm" onClick={() => setSiteType("landing")} className="flex-1">Landing Page</Button>
                        <Button variant={siteType === "institucional" ? "default" : "outline"} size="sm" onClick={() => setSiteType("institucional")} className="flex-1">Institucional</Button>
                      </div>
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
                    <div><Label>Keywords SEO (opcional)</Label><Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="ex: curso online, mentoria..." className="bg-secondary border-border" /></div>
                  </div>
                  <div>
                    <Label>Seções do site</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {ALL_SECTIONS.map((s) => (
                        <label key={s} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                          <Checkbox checked={sections.includes(s)} onCheckedChange={() => toggleSection(s)} />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="gap-2 border-border"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
                <Button onClick={handleGenerate} className="gap-2 flex-1"><Sparkles className="h-4 w-4" /> Gerar com IA <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: AI Generation */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              {generating && (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-semibold text-foreground">{genStep}</p>
                </div>
              )}
              {generatedPrompt && (
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-foreground">Prompt Gerado</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(generatedPrompt); toast.success("Copiado!"); }} className="gap-1 border-border"><Copy className="h-3 w-3" /> Copiar</Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        const blob = new Blob([generatedPrompt], { type: "text/plain" });
                        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${siteName || "site"}-prompt.txt`; a.click();
                      }} className="gap-1 border-border"><Download className="h-3 w-3" /> .txt</Button>
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto bg-secondary rounded-lg p-4 text-sm">
                    <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{generatedPrompt}</ReactMarkdown></div>
                  </div>
                </div>
              )}
              {!generating && generatedPrompt && (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setGeneratedPrompt(""); handleGenerate(); }} className="gap-2 border-border"><Sparkles className="h-4 w-4" /> Gerar Novamente</Button>
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2 border-border"><ArrowLeft className="h-4 w-4" /> Editar</Button>
                  <Button onClick={() => setStep(3)} className="gap-2 flex-1">Salvar <ArrowRight className="h-4 w-4" /></Button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: Save */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div className="bg-card rounded-xl border border-border p-8 text-center space-y-4 max-w-md mx-auto">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"><Check className="h-8 w-8 text-primary" /></div>
                <h2 className="text-xl font-bold text-foreground">Site pronto!</h2>
                <p className="text-sm text-muted-foreground">"{siteName || selectedNiche?.title}" — {sections.length} seções</p>
                <div className="space-y-3 pt-4">
                  <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar em Meus Projetos
                  </Button>
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(generatedPrompt); toast.success("Copiado!"); }} className="w-full gap-2 border-border"><Copy className="h-4 w-4" /> Copiar Prompt</Button>
                  <Button variant="ghost" onClick={() => setStep(2)} className="w-full gap-2 text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
