"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSidebar } from "@/components/sidebar-provider"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileEdit, FolderOpen, Settings, PlusCircle, ChevronLeft, FileText, Brain, LogOut, School } from "lucide-react"

export function MainSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, toggleSidebar } = useSidebar()
  const { user, isAuthenticated, logout, isLoading } = useAuth()

  // Protection simple : redirection si déconnecté sur une route dashboard
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname.startsWith("/dashboard")) {
      console.log("Non authentifié sur une route dashboard. Redirection vers /login.")
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, pathname, router])

  const allNavItems = [
    {
      title: "Tableau de bord",
      href: user?.role === "etudiant" ? "/dashboard/dashboard-eleve" : "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Nouvel éditeur",
      href: "/dashboard/editeur",
      icon: FileEdit,
      roles: ["enseignant", "admin"]
    },
    {
      title: "Mes Matières",
      href: "/dashboard/matieres",
      icon: School,
    },
    {
      title: "Mes Documents",
      href: "/dashboard/documents",
      icon: FileText,
      roles: ["enseignant", "admin"]
    },

    {
      title: "Importer et Traiter",
      href: "/importer-document",
      icon: Brain,
      roles: ["enseignant", "admin"]
    },
    {
      title: "Paramètres",
      href: "/dashboard/parametres",
      icon: Settings,
    },
  ]

  const navItems = allNavItems.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  )

  // Générer les initiales de l'utilisateur
  const getUserInitials = () => {
    if (!user) return "?"

    if (user.prenom && user.nom) {
      return `${user.prenom[0]}${user.nom[0]}`.toUpperCase()
    }

    if (user.prenom) {
      return user.prenom.substring(0, 2).toUpperCase()
    }

    if (user.nom) {
      return user.nom.substring(0, 2).toUpperCase()
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase()
    }

    return "?"
  }

  // Obtenir le nom d'affichage
  const getDisplayName = () => {
    if (!user) return "Utilisateur"

    // Si on a les deux, c'est l'idéal
    if (user.prenom && user.nom) {
      return `${user.prenom} ${user.nom}`
    }

    // Fallback sur l'un ou l'autre
    const name = user.prenom || user.nom
    if (name) return name

    // Dernier recours : email ou "Utilisateur"
    return user.email || "Utilisateur"
  }

  // Obtenir le rôle traduit
  const getDisplayRole = () => {
    if (!user) return ""

    switch (user.role) {
      case "enseignant":
        return "Enseignant"
      case "etudiant":
        return "Étudiant"
      case "admin":
        return "Administrateur"
      default:
        return user.role
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed top-0 left-0 h-full z-40">
        <Button variant="ghost" size="icon" className="m-2" onClick={toggleSidebar}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-background border-r border-border h-screen w-64 flex-shrink-0 transition-all duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold text-primary">XCSM</h2>
          <p className="text-sm text-muted-foreground">Plateforme d'édition</p>
        </div>

        {user?.role === "enseignant" && (
          <div className="p-4">
            <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Créer un document
            </Button>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1 overflow-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>

        {/* Section utilisateur dynamique */}
        <div className="p-4 border-t border-border">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white font-medium">
                {getUserInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground">{getDisplayRole()}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                onClick={logout}
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium">
                ?
              </div>
              <div>
                <p className="text-sm font-medium">Non connecté</p>
                <p className="text-xs text-muted-foreground">
                  <Link href="/login" className="text-primary hover:underline">
                    Se connecter
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}