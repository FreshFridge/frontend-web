import {
  createContext,
  useEffect,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AUTH_LOGOUT_EVENT } from "../api/client";

type AuthContextValue = {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem("token")),
  );

  const login = (token: string) => {
    localStorage.setItem("token", token);
    console.log("TOKEN:", token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const handleExternalLogout = () => {
      setIsAuthenticated(false);
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleExternalLogout);
    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleExternalLogout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
