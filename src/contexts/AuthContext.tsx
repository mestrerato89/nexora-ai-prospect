import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  canViewAllLeads: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  canViewAllLeads: false,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canViewAllLeads, setCanViewAllLeads] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: if auth takes more than 5 seconds, stop loading
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth timeout - forcing loading to false");
        setLoading(false);
      }
    }, 5000);

    // Use onAuthStateChange for everything (avoids lock contention with getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Don't await - let it run in background so loading finishes fast
        checkAdminRole(currentUser).catch(console.error);
      } else {
        setIsAdmin(false);
        setCanViewAllLeads(false);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminRole = async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      return;
    }

    // First check: special admin email
    if (currentUser.email === "huguinhoask@gmail.com") {
      setIsAdmin(true);
      setCanViewAllLeads(true);
      // Also ensure the profile exists
      ensureProfileExists(currentUser);
      return;
    }

    // Second check: database profile role
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        // If there's an RLS or other error, still allow user in (just not admin)
        setIsAdmin(false);
        return;
      }

      // If no profile exists, create one automatically
      if (!data) {
        await ensureProfileExists(currentUser);
        setIsAdmin(false);
        return;
      }

      if ((data as any)?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setCanViewAllLeads((data as any)?.can_view_all_leads || (data as any)?.role === 'admin');
    } catch (err) {
      console.error("Error checking role:", err);
      setIsAdmin(false);
    }
  };

  const ensureProfileExists = async (currentUser: User) => {
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from('profiles').insert({
          user_id: currentUser.id,
          email: currentUser.email || '',
          display_name: currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'Usuário',
        });
        console.log("Profile auto-created for user:", currentUser.id);
      }
    } catch (err) {
      console.error("Error ensuring profile exists:", err);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      toast.success("Sessão encerrada");
      window.location.href = "/login";
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error("Erro ao sair", { description: error.message });
      // Still clear local state as a fallback
      setUser(null);
      setIsAdmin(false);
      setCanViewAllLeads(false);
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, canViewAllLeads, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
