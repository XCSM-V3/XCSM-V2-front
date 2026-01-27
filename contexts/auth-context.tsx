"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useAuth as useAuthHook } from "@/hooks/use-api"

const AuthContext = createContext<ReturnType<typeof useAuthHook> | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthHook()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
