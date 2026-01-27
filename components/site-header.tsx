"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoginDialog } from "@/components/auth/login-dialog"
import { BookOpen, ChevronDown, User as UserIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ModeToggle } from "@/components/mode-toggle"

export function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getDashboardLink = () => {
    if (user?.role === "enseignant") {
      return "/dashboard"
    } else if (user?.role === "etudiant") {
      return "/dashboard/dashboard-eleve"
    }
    return "/dashboard"
  }

  const getDisplayName = () => {
    if (!user) return ""
    return user.prenom || user.nom || user.email || "Utilisateur"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-green-100 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href={isAuthenticated ? getDashboardLink() : "/"} className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-green-600" />
            <span className="font-bold text-green-700">XCSM</span>
          </Link>

          <nav className="hidden md:flex gap-6">
            <Link href="/aide" className="text-sm font-medium transition-colors hover:text-green-600">
              Aide
            </Link>

            <Link href="/contact" className="text-sm font-medium transition-colors hover:text-green-600">
              Contact
            </Link>
            <Link href={isAuthenticated ? getDashboardLink() : "/"} className="text-sm font-medium transition-colors hover:text-green-600">
              Accueil
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-sm font-medium transition-colors hover:text-green-600">
                Ressources
                <ChevronDown className="ml-1 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-green-100">

                <DropdownMenuItem asChild>
                  <Link href="/tutoriels">Tutoriels</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/faq">FAQ</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />
          {isAuthenticated && user ? (
            <>
              <Button
                variant="outline"
                className="border-green-200 hover:bg-green-50 hover:text-green-700"
                onClick={() => router.push(getDashboardLink())}
              >
                Tableau de bord
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:text-green-600">
                    <UserIcon className="h-4 w-4" />
                    <span className="max-w-[150px] truncate">{getDisplayName()}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-green-100">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => router.push(getDashboardLink())}>Tableau de bord</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/parametres")}>Paramètres</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Déconnexion</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <LoginDialog />
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/inscription">S'inscrire</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
