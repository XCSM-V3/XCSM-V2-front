"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ArrowLeft, Loader2, BookOpen, AlertCircle } from "lucide-react"
import { api } from "@/lib/api"

export default function CreateCoursePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    code: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.titre.trim()) {
      setError("Le titre est obligatoire")
      return
    }

    if (!formData.description.trim()) {
      setError("La description est obligatoire")
      return
    }

    setIsLoading(true)

    try {
      const course = await api.createCourse({
        titre: formData.titre,
        description: formData.description,
        code: formData.code || undefined,
      })

      alert("Cours créé avec succès !")
      router.push(`/cours/${course.id}`)
    } catch (error: any) {
      setError(error.message || "Erreur lors de la création du cours")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>

        {/* Titre principal */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            Créer un nouveau cours
          </h1>
          <p className="text-lg text-muted-foreground">
            Remplissez les informations pour créer votre cours
          </p>
        </div>

        {/* Formulaire */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <CardTitle className="text-2xl">Informations du cours</CardTitle>
                <CardDescription>
                  Les champs marqués d'un * sont obligatoires
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">Erreur</h4>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="titre" className="text-base font-medium">
                  Titre du cours <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="titre"
                  placeholder="Ex: Introduction à Python"
                  value={formData.titre}
                  onChange={(e) =>
                    setFormData({ ...formData, titre: e.target.value })
                  }
                  disabled={isLoading}
                  className="text-base"
                />
                <p className="text-sm text-muted-foreground">
                  Le titre doit être clair et descriptif
                </p>
              </div>

              {/* Code du cours */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-base font-medium">
                  Code du cours{" "}
                  <span className="text-muted-foreground font-normal">(optionnel)</span>
                </Label>
                <Input
                  id="code"
                  placeholder="Ex: PYTHON101"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  disabled={isLoading}
                  className="text-base"
                  maxLength={20}
                />
                <p className="text-sm text-muted-foreground">
                  Laissez vide pour générer automatiquement un code unique
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre cours, les objectifs pédagogiques, les prérequis..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={isLoading}
                  rows={6}
                  className="text-base resize-none"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Minimum 20 caractères recommandés</span>
                  <span>{formData.description.length} caractères</span>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  📚 Prochaines étapes
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ajoutez du contenu via l'import de documents</li>
                  <li>• Organisez vos cours en parties et chapitres</li>
                  <li>• Partagez le code du cours avec vos étudiants</li>
                </ul>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Créer le cours
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Section aide */}
        <div className="max-w-3xl mx-auto mt-8">
          <Card className="bg-muted/30 border-border">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">
                💡 Conseils pour un bon cours
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>
                    Choisissez un titre explicite qui décrit le contenu
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>
                    Détaillez les objectifs pédagogiques dans la description
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>
                    Mentionnez les prérequis nécessaires si applicable
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>
                    Utilisez un code court et mémorable (ex: MATH101, PHYS202)
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}