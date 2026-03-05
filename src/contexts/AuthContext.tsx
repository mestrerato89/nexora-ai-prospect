import { createContext, useContext, ReactNode } from "react";

// Fixed user ID for single-user mode (no login required)
const FIXED_USER_ID = "00000000-0000-0000-0000-000000000001";

interface MockUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: MockUser;
  loading: boolean;
  signOut: () => Promise<void>;
}

const mockUser: MockUser = {
  id: FIXED_USER_ID,
  email: "admin@nexora.app",
};

const AuthContext = createContext<AuthContextType>({
  user: mockUser,
  loading: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: mockUser, loading: false, signOut: async () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}
