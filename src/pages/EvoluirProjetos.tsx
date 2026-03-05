import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  PlusCircle, Bug, Palette, SlidersHorizontal, Plug, Brain, Code2, ImagePlus, Zap, Smartphone, ArrowLeft, Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EvolutionOption {
  id: string;
  title: string;
  icon: any;
  description: string;
  prompt: string;
}

const CATEGORIES = [
  {
    label: "DESENVOLVIMENTO",
    items: [
      {
        id: "add-feature",
        title: "ADICIONAR FUNÇÃO",
        icon: PlusCircle,
        description: "Adicionar uma nova funcionalidade ao projeto.",
        prompt: `Contexto: Preciso adicionar uma nova funcionalidade ao meu aplicativo web existente.

Tarefa:
1. Crie o componente/página necessário com UI responsiva
2. Integre com o backend (Supabase) se necessário
3. Adicione navegação e rotas
4. Implemente validações e tratamento de erros
5. Garanta consistência visual com o design system existente

Requisitos:
- A funcionalidade deve seguir o padrão de código existente
- Use componentes do shadcn/ui quando possível
- Implemente feedback visual (toasts, loading states)
- Garanta que funcione em mobile e desktop
- Adicione tipagem TypeScript completa

Tecnologias: React, TailwindCSS, TypeScript, Supabase
Idioma da interface: Português (BR)`,
      },
      {
        id: "fix-bug",
        title: "CORRIGIR BUG",
        icon: Bug,
        description: "Identificar e corrigir bugs no código.",
        prompt: `Contexto: Preciso identificar e corrigir um bug no meu aplicativo web.

Tarefa:
1. Analise o erro reportado e identifique a causa raiz
2. Verifique logs do console e requisições de rede
3. Corrija o bug sem introduzir regressões
4. Adicione tratamento de erro adequado
5. Teste o fluxo completo após a correção

Requisitos:
- Não altere funcionalidades que estão funcionando
- Mantenha compatibilidade com o código existente
- Adicione logs de debug se necessário
- Verifique edge cases relacionados
- Documente a causa e a solução

Tecnologias: React, TailwindCSS, TypeScript
Idioma da interface: Português (BR)`,
      },
      {
        id: "ui-change",
        title: "MUDANÇA VISUAL / UI",
        icon: Palette,
        description: "Alterar layout, cores, tipografia ou componentes visuais.",
        prompt: `Contexto: Preciso fazer ajustes visuais e de UI no meu aplicativo web.

Tarefa:
1. Identifique os componentes que precisam de ajuste visual
2. Aplique as mudanças mantendo consistência com o design system
3. Use tokens semânticos de cor (--primary, --secondary, etc.)
4. Garanta responsividade em todos os breakpoints
5. Adicione animações sutis com framer-motion se apropriado

Requisitos:
- Use apenas classes Tailwind com tokens do design system
- Não use cores hardcoded (text-white, bg-black, etc.)
- Mantenha acessibilidade (contraste, foco visível)
- Teste em modo claro e escuro
- Garanta que textos não quebrem em telas pequenas

Tecnologias: React, TailwindCSS, TypeScript, shadcn/ui
Idioma da interface: Português (BR)`,
      },
    ],
  },
  {
    label: "AJUSTES TÉCNICOS E INTEGRAÇÕES",
    items: [
      {
        id: "adjust-function",
        title: "AJUSTAR FUNÇÃO",
        icon: SlidersHorizontal,
        description: "Modificar comportamento de uma função existente.",
        prompt: `Contexto: Preciso ajustar o comportamento de uma funcionalidade existente no meu aplicativo.

Tarefa:
1. Localize a função/componente que precisa ser ajustado
2. Entenda o comportamento atual antes de modificar
3. Faça as alterações necessárias de forma incremental
4. Mantenha a interface pública (props, tipos) compatível
5. Teste o fluxo completo após as alterações

Requisitos:
- Não quebre funcionalidades dependentes
- Mantenha tipagem TypeScript correta
- Atualize testes se existirem
- Use search-replace em vez de reescrever arquivos inteiros
- Documente mudanças significativas de comportamento

Tecnologias: React, TailwindCSS, TypeScript
Idioma da interface: Português (BR)`,
      },
      {
        id: "integrate-tool",
        title: "INTEGRAR FERRAMENTA",
        icon: Plug,
        description: "Conectar APIs, serviços externos ou bibliotecas.",
        prompt: `Contexto: Preciso integrar uma ferramenta ou serviço externo ao meu aplicativo web.

Tarefa:
1. Configure a conexão com o serviço (API key, endpoints)
2. Crie uma Edge Function para proxy seguro das requisições
3. Implemente a lógica de integração no frontend
4. Adicione tratamento de erros e rate limiting
5. Configure variáveis de ambiente para as credenciais

Requisitos:
- Nunca exponha API keys no frontend
- Use Edge Functions para chamadas autenticadas
- Implemente retry logic para falhas temporárias
- Adicione feedback visual durante operações assíncronas
- Trate erros 429 (rate limit) e 402 (créditos) adequadamente

Tecnologias: React, TypeScript, Supabase Edge Functions
Idioma da interface: Português (BR)`,
      },
      {
        id: "improve-ai",
        title: "MELHORAR IA / LÓGICA",
        icon: Brain,
        description: "Otimizar prompts, lógica de IA ou algoritmos.",
        prompt: `Contexto: Preciso melhorar a lógica de IA ou algoritmos do meu aplicativo.

Tarefa:
1. Analise a implementação atual de IA/lógica
2. Identifique pontos de melhoria (precisão, velocidade, custo)
3. Otimize prompts para respostas mais precisas
4. Implemente cache para reduzir chamadas desnecessárias
5. Adicione fallbacks para quando a IA falhar

Requisitos:
- Use modelos adequados ao caso (flash para velocidade, pro para precisão)
- Implemente streaming para respostas longas
- Adicione validação de output da IA
- Trate erros de rate limit graciosamente
- Monitore custos e uso de tokens

Tecnologias: React, TypeScript, Lovable AI Gateway
Idioma da interface: Português (BR)`,
      },
      {
        id: "refactor",
        title: "REFATORAR CÓDIGO",
        icon: Code2,
        description: "Reorganizar e melhorar a qualidade do código.",
        prompt: `Contexto: Preciso refatorar o código do meu aplicativo para melhorar manutenibilidade.

Tarefa:
1. Identifique arquivos grandes (>200 linhas) para dividir
2. Extraia componentes reutilizáveis
3. Mova lógica de negócio para hooks customizados
4. Elimine código duplicado
5. Melhore tipagem TypeScript

Requisitos:
- Não altere comportamento funcional (apenas estrutura)
- Mantenha todos os imports funcionando
- Crie arquivos menores e focados (max ~150 linhas)
- Use barrel exports (index.ts) para organização
- Teste que nada quebrou após refatoração

Tecnologias: React, TypeScript
Idioma da interface: Português (BR)`,
      },
      {
        id: "add-images",
        title: "ADICIONAR IMAGENS",
        icon: ImagePlus,
        description: "Gerar ou adicionar imagens, ícones e assets visuais.",
        prompt: `Contexto: Preciso adicionar imagens, ícones ou assets visuais ao meu aplicativo.

Tarefa:
1. Gere imagens adequadas ao contexto (hero, cards, backgrounds)
2. Salve em src/assets/ e importe como módulos ES6
3. Otimize tamanhos (use dimensões adequadas ao uso)
4. Adicione alt text descritivo para acessibilidade
5. Implemente lazy loading para imagens grandes

Requisitos:
- Use src/assets/ para imagens importadas em componentes
- Use public/ apenas para assets referenciados em CSS/HTML
- Dimensões entre 512x512 e 1920x1920
- Formatos: JPG para fotos, PNG para gráficos com transparência
- Sempre importe com: import img from "@/assets/nome.jpg"

Tecnologias: React, TailwindCSS
Idioma da interface: Português (BR)`,
      },
    ],
  },
  {
    label: "FINALIZAÇÃO",
    items: [
      {
        id: "optimize",
        title: "OTIMIZAÇÃO",
        icon: Zap,
        description: "Melhorar performance, SEO e carregamento.",
        prompt: `Contexto: Preciso otimizar a performance e SEO do meu aplicativo web.

Tarefa:
1. Analise o bundle size e identifique imports pesados
2. Implemente code splitting com React.lazy
3. Otimize imagens com lazy loading
4. Adicione meta tags SEO (title, description, OG tags)
5. Configure cache headers adequados

Requisitos:
- Title < 60 caracteres com keyword principal
- Meta description < 160 caracteres
- Único H1 por página
- Alt text em todas as imagens
- Semantic HTML (header, main, nav, footer)
- Lazy loading para imagens abaixo do fold
- JSON-LD quando aplicável

Tecnologias: React, Vite, TailwindCSS, TypeScript
Idioma da interface: Português (BR)`,
      },
      {
        id: "pwa",
        title: "TORNAR APP BAIXÁVEL (PWA)",
        icon: Smartphone,
        description: "Transformar o projeto em um Progressive Web App.",
        prompt: `Contexto: Preciso transformar meu aplicativo web em um Progressive Web App (PWA) que possa ser instalado no celular como um app nativo.

Tarefa:
1. Crie o arquivo manifest.json com todas as configurações necessárias
2. Configure o Service Worker para cache offline
3. Adicione ícones em todos os tamanhos necessários
4. Configure o splash screen para iOS e Android
5. Implemente estratégia de cache
6. Adicione banner de instalação customizado

Requisitos:
- O app deve funcionar offline com dados em cache
- Adicione meta tags para iOS
- Configure theme_color e background_color
- Implemente atualização automática do Service Worker
- Teste a instalação em Android e iOS
- Garanta que o app abra em fullscreen (display: standalone)

Tecnologias: React, TailwindCSS, TypeScript
Idioma da interface: Português (BR)`,
      },
    ],
  },
];

export default function EvoluirProjetos() {
  const [selected, setSelected] = useState<EvolutionOption | null>(null);

  const copyPrompt = () => {
    if (!selected) return;
    navigator.clipboard.writeText(selected.prompt);
    toast.success("Prompt copiado!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1100px]">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <selected.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-lg">{selected.title}</h2>
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    🤖 Prompt
                  </h3>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={copyPrompt}>
                    <Copy className="h-3.5 w-3.5" /> Copiar
                  </Button>
                </div>
                <pre className="bg-secondary rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                  {selected.prompt}
                </pre>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Code2 className="h-6 w-6 text-primary" /> Evoluir Projetos
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecione o tipo de atualização que deseja realizar no código.
                </p>
              </div>

              {CATEGORIES.map((cat) => (
                <div key={cat.label} className="space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat.label}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {cat.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-center group"
                      >
                        <item.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                          {item.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
