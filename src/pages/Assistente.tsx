import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Bot, Send, User, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; messages: Msg[] };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nexora-chat`;

export default function Assistente() {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "1", title: "Nova conversa", messages: [] },
  ]);
  const [activeId, setActiveId] = useState("1");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active = conversations.find((c) => c.id === activeId)!;
  const messages = active.messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateMessages = (msgs: Msg[]) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, messages: msgs, title: msgs[0]?.content.slice(0, 30) || "Nova conversa" } : c))
    );
  };

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    updateMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

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
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok) {
        if (resp.status === 429) { toast.error("Muitas requisições. Tente novamente em instantes."); setIsLoading(false); return; }
        if (resp.status === 402) { toast.error("Créditos esgotados."); setIsLoading(false); return; }
        throw new Error("Erro na API");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              const updated = [...newMessages, { role: "assistant" as const, content: assistantSoFar }];
              setConversations((prev) =>
                prev.map((c) => (c.id === activeId ? { ...c, messages: updated, title: newMessages[0]?.content.slice(0, 30) || "Nova conversa" } : c))
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao comunicar com o assistente");
    }
    setIsLoading(false);
  };

  const newConversation = () => {
    const id = Date.now().toString();
    setConversations((prev) => [...prev, { id, title: "Nova conversa", messages: [] }]);
    setActiveId(id);
  };

  const deleteConversation = (id: string) => {
    if (conversations.length <= 1) return;
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (activeId === id) setActiveId(remaining[0].id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const suggestions = [
    "Crie um script de abordagem para pizzarias",
    "Como precificar um app mobile?",
    "Gere uma proposta comercial",
    "Quais nichos são mais lucrativos para vender apps?",
  ];

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-7rem)] gap-0 -m-4 lg:-m-6">
        {/* Conversation sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-border bg-background flex flex-col overflow-hidden shrink-0"
            >
              <div className="p-3">
                <Button onClick={newConversation} variant="outline" className="w-full gap-2 border-border text-sm">
                  <Plus className="h-4 w-4" /> Nova Conversa
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors group ${c.id === activeId ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                      }`}
                  >
                    <Bot className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1 text-left">{c.title}</span>
                    {conversations.length > 1 && (
                      <Trash2
                        className="h-3 w-3 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
              <Bot className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Assistente IA</h1>
              <p className="text-xs text-muted-foreground">Gemini 3 Flash — Seu copiloto de vendas e prospecção</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Como posso ajudar?</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Pergunte qualquer coisa — vendas, código, dúvidas da plataforma, ideias e muito mais.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="text-left text-sm p-3 rounded-lg border border-border hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
              >
                {m.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground"
                  }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>pre]:bg-secondary [&>pre]:p-3 [&>pre]:rounded-lg">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2 max-w-3xl mx-auto">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="flex-1 resize-none rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-32"
                rows={1}
                disabled={isLoading}
              />
              <Button
                onClick={send}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
