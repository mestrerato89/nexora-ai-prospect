import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemInstruction = `Você é o assistente de IA da Rataria, uma plataforma de prospecção inteligente. Você ajuda vendedores e empreendedores com:
- Scripts de abordagem personalizados por nicho
- Análise de perfil de leads para sugestões de contato
- Dicas de vendas e prospecção
- Geração de propostas comerciais
- Estratégias de follow-up
- Análise de concorrência

Seja direto, profissional e focado em resultados. Responda em português brasileiro. Use emojis com moderação para ser acolhedor.`;

    const geminiContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: geminiContents,
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Too many requests to Gemini API.", details: t }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI gateway error", details: t }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Adapt plain JSON stream from Gemini to SSE (Server-Sent Events) expected by the frontend
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) return controller.close();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          let open = buf.indexOf("{");
          let close = buf.indexOf("}\n,");
          if (close === -1) close = buf.indexOf("}\n]");

          while (open !== -1 && close !== -1 && open < close) {
            const chunk = buf.slice(open, close + 1);
            buf = buf.slice(close + 1);
            try {
              const parsed = JSON.parse(chunk);
              const textChunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textChunk) {
                const sseData = JSON.stringify({ choices: [{ delta: { content: textChunk } }] });
                controller.enqueue(new TextEncoder().encode(`data: ${sseData}\n\n`));
              }
            } catch (e) {
              // Ignore incomplete JSON chunks until they parse
            }
            open = buf.indexOf("{");
            close = buf.indexOf("}\n,");
            if (close === -1) close = buf.indexOf("}\n]");
          }
        }
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
