import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NovoApp from "./pages/NovoApp";
import NovoSite from "./pages/NovoSite";
import ProjetosSalvos from "./pages/ProjetosSalvos";
import EvoluirProjetos from "./pages/EvoluirProjetos";
import ProspectorServicos from "./pages/ProspectorServicos";
import Prospeccao from "./pages/Prospeccao";
import Leads from "./pages/Leads";
import EmailMarketing from "./pages/EmailMarketing";
import Assistente from "./pages/Assistente";
import Contratos from "./pages/Contratos";
import AreaEstudos from "./pages/AreaEstudos";
import Suporte from "./pages/Suporte";
import Agenda from "./pages/Agenda";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Index />} />
              <Route path="/signup" element={<Index />} />
              <Route path="/forgot-password" element={<Index />} />
              <Route path="/reset-password" element={<Index />} />
              <Route path="/" element={<P><Index /></P>} />
              <Route path="/novo-app" element={<P><NovoApp /></P>} />
              <Route path="/novo-site" element={<P><NovoSite /></P>} />
              <Route path="/projetos-salvos" element={<P><ProjetosSalvos /></P>} />
              <Route path="/evoluir-projetos" element={<P><EvoluirProjetos /></P>} />
              <Route path="/prospector-servicos" element={<P><ProspectorServicos /></P>} />
              <Route path="/prospeccao" element={<P><Prospeccao /></P>} />
              <Route path="/leads" element={<P><Leads /></P>} />
              <Route path="/email-marketing" element={<P><EmailMarketing /></P>} />
              <Route path="/assistente" element={<P><Assistente /></P>} />
              <Route path="/contratos" element={<P><Contratos /></P>} />
              <Route path="/area-de-estudos" element={<P><AreaEstudos /></P>} />
              <Route path="/suporte" element={<P><Suporte /></P>} />
              <Route path="/agenda" element={<P><Agenda /></P>} />
              <Route path="/configuracoes" element={<P><Configuracoes /></P>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
