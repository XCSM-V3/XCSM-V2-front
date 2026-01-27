"use client"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/sidebar-provider"
import { Menu } from "lucide-react"

export function DashboardHeader() {
  const { isOpen, toggleSidebar } = useSidebar()

  return (
    <header className="bg-background border-b border-border py-4 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isOpen && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Bienvenue</h1>
            <p className="text-sm text-muted-foreground">Gérez vos cours et documents</p>
          </div>
        </div>
        {/* Bouton "Créer un document" supprimé */}
      </div>
    </header>
  )
}
