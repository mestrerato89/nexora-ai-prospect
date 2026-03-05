import { createContext, useContext, ReactNode } from "react";

// Fixed user ID for single-user mode (no login required)
const FIXED_USER_ID = "00000000-0000-0000-0000-000000000001";

interface MockUser {
  id: string;
  email: string;
  role: 'admin' | 'employee';
}

interface AuthContextType {
  user: MockUser;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const mockUser: MockUser = {
  id: FIXED_USER_ID,
  email: "huguinhoask@gmail.com",
  role: 'admin'
};

const AuthContext = createContext<AuthContextType>({
  user: mockUser,
  isAdmin: true,
  loading: false,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const isAdmin = mockUser.email === "huguinhoask@gmail.com" || mockUser.role === 'admin';

  return (
    <AuthContext.Provider value={{ user: mockUser, isAdmin, loading: false, signOut: async () => { } }}>
      {children}
    </AuthContext.Provider>
  );
}
