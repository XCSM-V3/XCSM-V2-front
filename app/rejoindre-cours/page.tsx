"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function RejoindreCoursPage() {
  const [courseCode, setCourseCode] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simuler la vérification du code de cours
    if (courseCode === "ABC123") {
      toast({
        title: "Succès",
        description: "Vous avez rejoint le cours avec succès.",
      })

      // Rediriger vers le dashboard étudiant
      router.push("/dashboard/dashboard-eleve")
    } else {
      toast({
        title: "Erreur",
        description: "Code de cours invalide. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center bg-gray-50 py-12">
        <div className="container max-w-md">
          <Card className="border border-green-100">
            <CardHeader>
              <CardTitle>Rejoindre un cours</CardTitle>
              <CardDescription>Entrez le code fourni par votre enseignant pour rejoindre un cours.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course-code">Code du cours</Label>
                  <Input
                    id="course-code"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="Ex: ABC123"
                    required
                    className="border-green-200 focus:border-green-300 focus:ring-green-300"
                  />
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                  Rejoindre le cours
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-500">
                Vous n'avez pas de code?{" "}
                <Button variant="link" className="p-0 h-auto text-green-600" onClick={() => router.push("/")}>
                  Contactez votre enseignant
                </Button>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
