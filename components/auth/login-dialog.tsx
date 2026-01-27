"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"

export function LoginDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalLoading(true)

    try {
      await login(email, password)
      setOpen(false)
      // La redirection est gérée par le login ou on peut forcer ici
      router.push("/dashboard")
    } catch (err) {
      // L'erreur est déjà gérée par le toast dans useAuth
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-green-200 hover:bg-green-50 hover:text-green-700">
          Connexion
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Connexion</DialogTitle>
          <DialogDescription>
            Accédez à votre espace XCSM
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9 border-green-100 focus:border-green-300 focus:ring-green-300"
                disabled={localLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 pr-10 border-green-100 focus:border-green-300 focus:ring-green-300"
                disabled={localLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={localLoading}>
              {localLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </DialogFooter>
        </form>
        <div className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Button variant="link" className="p-0 h-auto text-green-600" onClick={() => { setOpen(false); router.push("/inscription"); }}>
            S'inscrire
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
