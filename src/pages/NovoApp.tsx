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
  {
    id: "acaiteria", title: "Açaiteria", emoji: "🍇", img: imgAcaiteria, category: "delivery",
    features: ["Cardápio digital", "Pedidos online", "Programa de fidelidade", "Avaliações"],
    promptContext: `Serviços/Produtos exemplo com preços: Açaí 300ml (R$15), Açaí 500ml (R$22), Açaí 700ml com frutas (R$30), Tigela Power (R$28), Açaí com Granola e Banana (R$18).
Telas-chave: Home com "Monte seu Açaí" (tamanho → complementos → coberturas → finalizar), Cardápio por categorias (Açaís, Tigelas, Cremes, Sucos), Histórico de Pedidos, Rastreio de Entrega em tempo real.
Terminologia: complementos, coberturas, granola, leite em pó, leite condensado, paçoca, "monte seu açaí", caldas, frutas da estação.
Admin: Gestão de estoque de complementos, controle de entregas, dashboard de vendas por período.
Integrações-chave: iFood API para delivery, Mercado Pago/Pix para pagamentos.`
  },
  {
    id: "pizzaria", title: "Pizzaria", emoji: "🍕", img: imgPizzaria, category: "delivery",
    features: ["Cardápio digital", "Delivery", "Reservas de mesa", "Programa de fidelidade"],
    promptContext: `Serviços/Produtos exemplo com preços: Pizza Margherita Grande (R$45), Pizza Calabresa Média (R$38), Pizza Quatro Queijos Broto (R$28), Borda Recheada (+R$8), Refrigerante 2L (R$12), Combo Família 2 Pizzas + Refri (R$89).
Telas-chave: Home com promoção do dia (banner), "Monte sua Pizza" (tamanho → sabores → borda → adicionais), Cardápio categorizado (Tradicionais, Especiais, Doces, Bebidas), Rastreio com etapas (Preparo → Forno → Saiu para Entrega).
Terminologia: sabores, borda recheada, meio a meio, massa fina/tradicional, broto/média/grande/família, rodízio.
Admin: Gestão de pedidos em tempo real com status (Recebido → Preparando → No Forno → Saiu), controle de ingredientes.
Integrações-chave: Google Maps API para cálculo de frete por distância, iFood/Rappi integração.`
  },
  {
    id: "hamburgueria", title: "Hamburgueria", emoji: "🍔", img: imgHamburgueria, category: "delivery",
    features: ["Cardápio digital", "Pedidos online", "Combos promocionais", "Avaliações"],
    promptContext: `Serviços/Produtos exemplo com preços: Smash Burger Clássico (R$28), Burger Duplo Bacon (R$38), Veggie Burger (R$32), Combo Smash + Fritas + Milk (R$45), Porção de Onion Rings (R$18), Milk Shake Nutella (R$22).
Telas-chave: Home com "Combo da Semana" (banner animado), "Monte seu Burger" (pão → carne → queijo → extras → molhos), Cardápio (Burgers, Combos, Porções, Bebidas, Sobremesas), Avaliação do pedido com foto.
Terminologia: smash, blend de carnes, ponto da carne (mal passado/médio/bem passado), extras, molho especial, combo.
Admin: Painel de pedidos com tempo estimado de preparo, gestão de combos promocionais, controle de insumos.
Integrações-chave: WhatsApp para confirmação de pedido, gateway de pagamento com Pix.`
  },
  {
    id: "pastelaria", title: "Pastelaria", emoji: "🥟", img: imgPastelaria, category: "delivery",
    features: ["Cardápio digital", "Pedidos online", "Delivery", "Fidelidade"],
    promptContext: `Serviços/Produtos exemplo com preços: Pastel de Carne (R$10), Pastel de Queijo (R$9), Pastel Especial 4 Queijos (R$14), Caldo de Cana 500ml (R$8), Combo 3 Pastéis + Caldo (R$32).
Telas-chave: Home com "Pastel do Dia" e promoções, Cardápio (Salgados, Especiais, Doces, Bebidas), carrinho com observações por item, Fidelidade (a cada 10 pastéis, 1 grátis).
Terminologia: massa crocante, recheio, pastel assado/frito, caldo de cana, feira, combo.
Admin: Controle de produção (quantidade frita por turno), gestão de fila de pedidos.
Integrações-chave: Impressora térmica para comandas, Pix para pagamento.`
  },
  {
    id: "restaurante", title: "Restaurante", emoji: "🍽️", img: imgRestaurante, category: "delivery",
    features: ["Cardápio digital", "Reservas", "Delivery", "Chat com suporte"],
    promptContext: `Serviços/Produtos exemplo com preços: Filé Mignon ao Molho Madeira (R$65), Risoto de Camarão (R$58), Salada Caesar (R$28), Petit Gâteau (R$22), Carta de Vinhos a partir de R$89.
Telas-chave: Home com foto do ambiente + próxima reserva, Cardápio por refeição (Entradas, Pratos Principais, Sobremesas, Carta de Vinhos), Reserva de Mesa (data + hora + nº de pessoas + preferência ambiente interno/externo), Histórico com fotos dos pratos.
Terminologia: carta de vinhos, couvert, entrada, prato principal, sobremesa, harmonização, mesa para X pessoas, ambiente interno/externo.
Admin: Mapa de mesas em tempo real (ocupada/reservada/livre), gestão de reservas com confirmação, controle de pratos disponíveis.
Integrações-chave: Google Calendar para reservas, WhatsApp para confirmação 2h antes.`
  },
  {
    id: "cafeteria", title: "Cafeteria", emoji: "☕", img: imgCafeteria, category: "delivery",
    features: ["Cardápio digital", "Programa de fidelidade", "Pedidos online", "WiFi social"],
    promptContext: `Serviços/Produtos exemplo com preços: Espresso (R$8), Cappuccino (R$14), Latte Macchiato (R$16), Mocha (R$18), Croissant de Chocolate (R$12), Pão de Queijo (R$6), Combo Café + Pão de Queijo (R$12).
Telas-chave: Home com "Pedido Rápido" (repetir último pedido), Cardápio (Cafés Quentes, Gelados, Especiais da Casa, Acompanhamentos, Doces), Personalização (tipo de leite, intensidade, temperatura), WiFi Social (check-in para liberar senha).
Terminologia: blend, torrefação, coado, espresso, latte art, leite vegetal (aveia/amêndoa), drip coffee.
Admin: Controle de estoque de grãos, dashboard de produtos mais vendidos, gestão do WiFi social.
Integrações-chave: Loyalty API para pontos, Instagram integração para fotos de latte art.`
  },
  {
    id: "sorveteria", title: "Sorveteria", emoji: "🍦", img: imgSorveteria, category: "delivery",
    features: ["Cardápio digital", "Sabores do dia", "Fidelidade", "Pedidos online"],
    promptContext: `Serviços/Produtos exemplo com preços: Casquinha Simples (R$8), Casquinha Dupla (R$14), Sundae Clássico (R$18), Milk Shake 500ml (R$20), Açaí com Sorvete (R$22), Banana Split (R$25).
Telas-chave: Home com "Sabores Disponíveis Hoje" (atualizado em tempo real com indicador de estoque), Monte seu Sorvete (casquinha/copinho → sabores → coberturas → extras), Cardápio (Sorvetes, Picolés, Sundaes, Milk Shakes, Açaí), Programa de Fidelidade com selos visuais.
Terminologia: bola, casquinha, copinho, cobertura, calda quente, granulado, sabores do dia, artesanal, massa.
Admin: Gestão de sabores disponíveis (ativar/desativar por dia), controle de temperatura e estoque.
Integrações-chave: Push notification para "Novo sabor disponível hoje!", Pix QR Code na loja.`
  },
  {
    id: "marmitaria", title: "Marmitaria", emoji: "🍱", img: imgMarmitaria, category: "delivery",
    features: ["Cardápio semanal", "Assinatura mensal", "Delivery", "Pagamento online"],
    promptContext: `Serviços/Produtos exemplo com preços: Marmita P (R$16), Marmita M (R$20), Marmita G (R$26), Marmita Fit (R$22), Plano Semanal 5 Marmitas (R$85), Plano Mensal 20 Marmitas (R$320).
Telas-chave: Home com "Cardápio de Hoje" e "Cardápio da Semana", Assinatura (escolher plano → dias da semana → preferências alimentares → restrições), Marmita Avulsa (proteína + acompanhamentos + salada), Rastreio de Entrega.
Terminologia: marmita, quentinha, marmitex, self-service, por quilo, proteína, acompanhamento, salada, arroz/feijão, fit, low carb.
Admin: Planejamento de cardápio semanal, gestão de assinantes, rota de entregas otimizada.
Integrações-chave: Asaas para cobranças recorrentes, Google Maps para otimização de rotas de entrega.`
  },
  {
    id: "barbearia", title: "Barbearia", emoji: "✂️", img: imgBarbearia, category: "agendamento",
    features: ["Agendamento online", "Catálogo de serviços", "Programa de fidelidade", "Avaliações"],
    promptContext: `Serviços/Produtos exemplo com preços: Corte Degradê (R$45), Corte Social (R$35), Barba Completa (R$30), Combo Corte + Barba (R$65), Pigmentação (R$50), Hidratação Capilar (R$40), Sobrancelha (R$15).
Telas-chave: Home com banner de promoção ("Combo Corte + Barba por R$59,90"), card "Próximo Agendamento" (data, hora, barbeiro, serviço), status do Programa de Fidelidade (selos visuais, "Faltam X cortes para seu corte grátis!"), Últimos Serviços com avaliação por estrelas.
Fluxo de Agendamento: Seleção de Barbeiro (com mini-bio e especialidades) → Calendário dinâmico com slots → Confirmação → Push/WhatsApp lembrete.
Terminologia: degradê, fade, navalhado, barboterapia, hot towel, pomada modeladora, pente fino.
Admin: Agenda em tempo real por barbeiro, CRM com histórico de cada cliente, comissionamento.
Integrações-chave: WhatsApp Business API (lembrete 2h antes), Google Calendar sync, Asaas/Pix.
Navegação inferior: Início, Serviços, Agendar, Fidelidade, Perfil`
  },
  {
    id: "salao", title: "Salão de Beleza", emoji: "💇‍♀️", img: imgSalao, category: "agendamento",
    features: ["Agendamento online", "Catálogo", "Fidelidade", "Chat"],
    promptContext: `Serviços/Produtos exemplo com preços: Corte Feminino (R$80), Escova (R$50), Coloração (R$150), Luzes/Mechas (R$200), Progressiva (R$180), Manicure (R$35), Pedicure (R$40), Design de Sobrancelha (R$30), Combo Mani + Pedi (R$65).
Telas-chave: Home com "Próximo Agendamento" + promoções sazonais, Catálogo de Serviços por categoria (Cabelo, Unhas, Estética, Pacotes), Seleção de Profissional (foto + especialidade + avaliação), Galeria de Transformações (antes/depois).
Terminologia: coloração, mechas, balayage, luzes, progressiva, cauterização, hidratação profunda, nail art, esmaltação em gel.
Admin: Agenda por profissional (cabeleireira, manicure, esteticista), comissões, estoque de produtos (tintas, esmaltes).
Integrações-chave: Instagram para galeria de portfólio, WhatsApp para lembretes, pagamento parcial (sinal).
Navegação inferior: Início, Serviços, Agendar, Fidelidade, Perfil`
  },
  {
    id: "clinica", title: "Clínica / Saúde", emoji: "🏥", img: imgClinica, category: "saude",
    features: ["Agendamento", "Prontuário digital", "Lembretes", "Teleconsulta"],
    promptContext: `Serviços/Produtos exemplo com preços: Consulta Clínica Geral (R$200), Consulta Dermatologia (R$280), Exame de Sangue (R$80), Check-up Completo (R$450), Teleconsulta (R$150), Retorno (Gratuito em 30 dias).
Telas-chave: Home com "Próxima Consulta" + lembretes de exames pendentes, Busca por Especialidade (Clínico Geral, Dermatologista, Cardiologista, Ortopedista), Perfil do Médico (foto, CRM, formação, avaliação), Meus Exames (upload de resultados com visualização em PDF), Teleconsulta (videochamada integrada).
Terminologia: consulta, retorno, exame, prontuário, receita digital, atestado, especialidade, convênio, particular.
Admin: Prontuário eletrônico por paciente (LGPD compliant), agenda por médico/sala, gestão de convênios, emissão de receita digital.
Integrações-chave: Twilio/Daily.co para teleconsulta, certificado digital ICP-Brasil para receitas, Google Calendar.
Navegação inferior: Início, Especialidades, Agendar, Exames, Perfil`
  },
  {
    id: "academia", title: "Academia", emoji: "🏋️", img: imgAcademia, category: "saude",
    features: ["Check-in digital", "Planos de treino", "Agendamento de aulas", "Pagamento recorrente"],
    promptContext: `Serviços/Produtos exemplo com preços: Plano Mensal (R$99), Plano Trimestral (R$249), Plano Anual (R$899), Aula Avulsa de Spinning (R$30), Personal Trainer/hora (R$80), Avaliação Física (R$60).
Telas-chave: Home com "Check-in" (QR Code na entrada), Ficha de Treino do dia (exercícios com séries, repetições, carga, GIF/vídeo demonstrativo), Agenda de Aulas Coletivas (Spinning, Yoga, Funcional, Crossfit - com vagas disponíveis), Evolução Física (gráficos de peso, medidas, fotos de progresso), Planos e Pagamentos.
Terminologia: treino A/B/C, séries, repetições, carga, supino, agachamento, esteira, spinning, funcional, personal trainer, avaliação física, IMC.
Admin: Gestão de alunos e planos, criação de fichas de treino, controle de acesso (catraca), dashboard de frequência e inadimplência.
Integrações-chave: Asaas para cobrança recorrente (boleto/cartão/Pix), QR Code para check-in, wearables (Google Fit/Apple Health).
Navegação inferior: Início, Treino, Aulas, Evolução, Perfil`
  },
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
            content: `Crie uma ESPECIFICAÇÃO TÉCNICA COMPLETA E PREMIUM para o desenvolvimento de um aplicativo mobile-first.

DADOS DO PROJETO:
- Nome do App: "${appName || selectedNiche?.title}"
- Nicho: ${selectedNiche?.title}
- Tema Visual: ${theme === "light" ? "Light Mode clean e moderno" : "Dark Mode premium e sofisticado"}
- Cor Primária (CTA, ícones ativos, destaques): ${primaryColor}
- Funcionalidades selecionadas: ${features.join(", ")}
- Descrição adicional: ${description || "Aplicativo premium para o nicho"}

CONTEXTO ESPECÍFICO DO NICHO (use estes dados OBRIGATORIAMENTE como base para o conteúdo):
${selectedNiche?.promptContext || "Sem contexto adicional."}

ESTRUTURA OBRIGATÓRIA DO DOCUMENTO (siga EXATAMENTE esta ordem):

## 1. Visão Geral do Projeto
- Nome, Nicho, Conceito do app (1 parágrafo forte e conciso)
- Design: descreva a estética visual (ex: "Dark Mode profundo, transmitindo sofisticação")
- Objetivo Principal: qual problema o app resolve para o usuário final

## 2. Telas e Funcionalidades Detalhadas
### A. Fluxo do Cliente (Client-Side)
Para CADA tela, descreva:
- Nome da tela
- O que ela exibe (elementos visuais: banners, cards, atalhos, status)
- Interações do usuário
- Telas obrigatórias: Onboarding/Login, Home (Dashboard com banner de promoção, próximo agendamento/pedido, status de fidelidade), Catálogo/Cardápio detalhado com categorias, Fluxo principal (agendamento/pedido), Programa de Fidelidade (carteira digital de selos), Histórico com avaliações (1-5 estrelas)

### B. Painel do Administrador (Admin-Side)
- Agenda/Pedidos em tempo real
- Gestão de Clientes (CRM básico com histórico)
- Configurações de serviços/produtos (preços, tempos)
- Dashboard com métricas

## 3. Estrutura de Dados Sugerida
Liste as tabelas/coleções com seus campos:
- Users: id, nome, celular, email, role, avatar_url
- (Tabelas específicas do nicho: Services/Products, Appointments/Orders, etc.)
- LoyaltyCards: user_id, pontos, total_acumulado
- Reviews: id, user_id, rating, comentario, data

## 4. Sugestões de UI/UX (Design System)
SEJA EXTREMAMENTE ESPECÍFICO:
- Cor de fundo: hex exato (ex: #121212 para dark)
- Cor de superfícies/cards: hex exato (ex: #1e1e1e)
- Cor primária: ${primaryColor} (para CTAs, ícones ativos, selos)
- Cor de texto: hex exato
- Tipografia: fonte específica (ex: Inter, Montserrat) com pesos para títulos e corpo
- Border radius dos botões (ex: 8px)
- Componentes: skeleton screens, feedback tátil, animações de transição
- Navegação inferior (tab bar) com ícones: liste cada aba

## 5. Integrações Recomendadas
Liste integrações CONCRETAS com nome da API:
- Mensageria (WhatsApp Business API para lembretes)
- Calendário (Google Calendar API)
- Pagamento (Stripe/Asaas/Pix)
- Push Notifications (Firebase Cloud Messaging)
- Outras relevantes ao nicho

## 6. Requisitos Técnicos
- Frontend: framework específico (React Native ou Flutter)
- Backend: framework específico (Node.js + Fastify/NestJS)
- Banco de Dados: PostgreSQL ou Supabase
- Cache: Redis para evitar conflitos (double booking/pedidos duplicados)
- Hospedagem: AWS ou GCP

## 7. Instrução Final para IA de Código
Termine com um parágrafo começando com "Aja como um desenvolvedor Full Stack Senior..." instruindo a IA a gerar a estrutura de pastas, esquema de cores no tema e a lógica de validação do componente principal do app.

REGRAS DE QUALIDADE:
- NÃO seja genérico. Cada seção deve ter conteúdo ESPECÍFICO para o nicho "${selectedNiche?.title}".
- Use terminologia do nicho (ex: para barbearia use "Corte Degradê", "Barba Completa"; para pizzaria use "sabores", "borda recheada").
- O resultado deve parecer uma especificação técnica profissional de consultoria, NÃO um esboço superficial.
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
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao gerar prompt");
      setGenStep(String(e?.message || e));
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
