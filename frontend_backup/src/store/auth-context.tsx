"use client";

import * as React from "react";
import { User } from "@/types";

interface AuthState {
  user: User;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  clearError: () => void;
}

const demoUser: User = {
  id: "demo-user",
  email: "demo@grademind.local",
  name: "Demo Teacher",
  role: "teacher",
  createdAt: "",
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<AuthState>({
    user: demoUser,
    token: null,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });

  const logout = async () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider value={{ ...state, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

