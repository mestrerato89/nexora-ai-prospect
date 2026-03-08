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

  const toggleSection = (s: string) =>
    setSections((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const selectNiche = (n: typeof NICHOS[0]) => {
    setSelectedNiche(n);
    setSections(n.sections);
    setSiteName("");
    setDescription("");
    setStep(1);
  };

  const handleGenerate = async () => {
    setStep(2);
    setGenerating(true);
    setGeneratedPrompt("");

    const steps = ["Analisando nicho...", "Definindo estrutura...", "Gerando conteúdo...", "Finalizando..."];
    for (const s of steps) { setGenStep(s); await new Promise((r) => setTimeout(r, 800)); }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Crie uma ESPECIFICAÇÃO TÉCNICA COMPLETA E PREMIUM para a criação de um ${siteType === "landing" ? "Landing Page de Alta Conversão" : "Site Institucional Completo"}.

DADOS DO PROJETO:
- Nome: "${siteName || selectedNiche?.title}"
- Nicho: ${selectedNiche?.title}
- Tipo: ${siteType === "landing" ? "Landing Page de Alta Conversão" : "Site Institucional Completo"}
- Tema Visual: ${theme === "light" ? "Light Mode clean e elegante" : "Dark Mode premium e sofisticado (Dark Mode)"}
- Cor Primária (Acentuação, CTAs): ${primaryColor}
- Seções selecionadas: ${sections.join(", ")}
- Keywords SEO: ${keywords || "Automáticas baseadas no nicho"}
- Descrição adicional: ${description || "Site premium para o nicho"}

ESTRUTURA OBRIGATÓRIA DO DOCUMENTO (siga EXATAMENTE esta ordem):

## 1. Configurações Globais
- Nome da Solução, Tipo de Página, Tema Visual
- Cor Primária: ${primaryColor} (hex exato)
- Cor de Fundo Principal: hex exato (ex: #1A1A2E para dark, #FAFAFA para light)
- Cor de Texto Principal: hex exato para alto contraste
- Tipografia: fonte ESPECÍFICA para Headlines (ex: Montserrat Bold) e Corpo (ex: Open Sans Regular)
- Iconografia: estilo dos ícones (minimalistas, cor primária ou branco)

## 2. Estrutura de Seções, Copy e Estratégia de Conversão
Para CADA seção, inclua OBRIGATORIAMENTE:

### 2.1 Seção Hero (Acima da Dobra)
- Layout: Full-width com imagem/vídeo de fundo + overlay escuro
- H1 (Headline): texto ESPECÍFICO para o nicho "${selectedNiche?.title}" (NÃO genérico)
- Subheadline: texto persuasivo complementar
- CTA Principal: texto do botão, estilo, cor (${primaryColor}), destino
- Elemento visual adicional (setas, animações)

### 2.2 Seção de Benefícios/Recursos
- Título H2 e Subtítulo
- 3-4 cards com: Ícone + Título H3 + Descrição curta
- Conteúdo 100% relevante ao nicho "${selectedNiche?.title}"

### 2.3 Seções específicas do nicho
(Ex: para Barbearia = Galeria de Cortes + Agendamento; para Restaurante = Cardápio + Reservas; para E-commerce = Vitrine de Produtos + Categorias)
- Cada seção com: Layout, Títulos H2/H3, Copy persuasivo, CTAs

### 2.4 Seção de Depoimentos/Casos de Sucesso
- 2-3 depoimentos com: Foto, Nome, Avaliação (estrelas), Citação realista do nicho

### 2.5 Seção CTA Final / Formulário
- Título H2 urgente
- Formulário: campos obrigatórios e opcionais
- Botão de envio com texto persuasivo
- Texto de privacidade

### 2.6 Footer
- Links, Redes Sociais, Contato, Copyright

## 3. Estratégia de SEO
- Meta Title: texto otimizado (máx 60 chars)
- Meta Description: texto persuasivo (máx 160 chars)
- Heading Structure: H1, H2s, H3s listados
- Keywords SEO: 8-12 palavras-chave relevantes ao nicho

## 4. Layout Sugerido (Desktop e Mobile)
### Desktop:
- Espaçamento, alinhamento, tamanhos de imagem
- Animações sutis (fade-in ao scroll, hover effects)
### Mobile:
- Responsividade, empilhamento vertical
- CTAs sticky, tipografia ajustada

## 5. Integrações Recomendadas
Liste integrações CONCRETAS com nome da API/serviço:
- Analytics (Google Analytics 4 + Tag Manager)
- Marketing (Facebook Pixel / Meta Pixel)
- CRM e E-mail Marketing (Mailchimp, RD Station)
- Suporte (JivoChat, Tawk.to, WhatsApp Business)
- Outras relevantes ao nicho

REGRAS DE QUALIDADE:
- NÃO seja genérico. Todo conteúdo (copy, títulos, CTAs) deve ser ESPECÍFICO para "${selectedNiche?.title}".
- Use terminologia do nicho nos textos sugeridos.
- O resultado deve parecer uma especificação de consultoria profissional de alta qualidade.
- Formato: Markdown bem estruturado com headers, listas e sub-listas.`
          }],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`${resp.status} - ${errText}`);
      }

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
    } catch (err: any) {
      toast.error("Erro ao gerar prompt");
      setGenStep(err?.message || "Erro desconhecido");
    }
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
              {!generating && !generatedPrompt && (
                <div className="bg-card rounded-xl border border-destructive/20 p-12 text-center space-y-4">
                  <p className="text-lg font-semibold text-destructive">Ocorreu um erro ao gerar o prompt:</p>
                  <p className="text-sm font-mono text-muted-foreground break-words bg-black/20 p-4 rounded-xl">{genStep}</p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setStep(1)} className="gap-2 border-border"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
                    <Button onClick={() => { setGeneratedPrompt(""); handleGenerate(); }} className="gap-2"><Sparkles className="h-4 w-4" /> Tentar Novamente</Button>
                  </div>
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
