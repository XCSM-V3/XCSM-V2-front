"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import {
  Search,
  FileText,
  BookOpen,
  Loader2,
  AlertCircle,
  ChevronRight
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface GranuleResult {
  granule_id: string
  mongo_id: string
  titre: string
  type_contenu: string
  ordre: number
  content_preview: string
  cours: {
    id: string
    titre: string
    code: string
  }
  chemin_hierarchique: {
    partie: string
    chapitre: string
    section: string
    sous_section: string
  }
  enseignant: string
  source_pdf_page: number | null
}

export default function SearchGranulesPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GranuleResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [userRole, setUserRole] = useState("")
  const [accessibleCoursesCount, setAccessibleCoursesCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) {
      alert("Veuillez entrer un terme de recherche")
      return
    }

    setIsSearching(true)
    setHasSearched(true)
    setError(null)

    try {
      const response = await api.searchGranules(query)
      setResults(response.results)
      setUserRole(response.user_role)
      setAccessibleCoursesCount(response.accessible_courses_count)
    } catch (error: any) {
      console.error("Erreur:", error)
      setError(error.message || "Erreur lors de la recherche")
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'))
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 font-semibold">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vous devez être connecté pour effectuer une recherche.
            </AlertDescription>
          </Alert>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Recherche de contenus
          </h1>
          <p className="text-lg text-gray-600">
            {user?.role === "enseignant"
              ? "Recherchez dans les contenus de vos cours"
              : "Recherchez dans les contenus de vos cours inscrits"}
          </p>
          {accessibleCoursesCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {accessibleCoursesCount} cours accessible{accessibleCoursesCount > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Barre de recherche */}
        <Card className="max-w-4xl mx-auto mb-8">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Ex: fonction mathématique, équation, théorème..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 text-base"
                  disabled={isSearching}
                />
              </div>
              <Button
                onClick={handleSearch}
                className="bg-green-600 hover:bg-green-700 px-8"
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recherche...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Rechercher
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              💡 Astuce : Soyez spécifique pour des résultats plus pertinents
            </p>
          </CardContent>
        </Card>

        {/* Erreur */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Résultats */}
        {isSearching ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          </div>
        ) : hasSearched ? (
          results.length === 0 ? (
            <Card className="max-w-4xl mx-auto">
              <CardContent className="text-center py-20">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-500">
                  Essayez avec d'autres termes de recherche
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* En-tête résultats */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {results.length} résultat{results.length > 1 ? "s" : ""} trouvé
                  {results.length > 1 ? "s" : ""}
                </h2>
                <p className="text-gray-600">
                  Pour la recherche : "{query}"
                </p>
              </div>

              {/* Liste des résultats */}
              <div className="space-y-4">
                {results.map((granule) => (
                  <Card
                    key={granule.granule_id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              {granule.cours.code}
                            </Badge>
                            <Badge variant="outline">
                              {granule.type_contenu}
                            </Badge>
                            {granule.source_pdf_page && (
                              <Badge variant="outline" className="text-xs">
                                Page {granule.source_pdf_page}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl mb-2">
                            {highlightText(granule.titre, query)}
                          </CardTitle>
                        </div>
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                    </CardHeader>

                    <CardContent>
                      {/* Chemin hiérarchique */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          📚 Localisation dans le cours
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <BookOpen className="h-4 w-4" />
                          <span>{granule.cours.titre}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span>{granule.chemin_hierarchique.partie}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span>{granule.chemin_hierarchique.chapitre}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span>{granule.chemin_hierarchique.section}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span className="font-medium">{granule.chemin_hierarchique.sous_section}</span>
                        </div>
                      </div>

                      {/* Aperçu du contenu */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-900 line-clamp-3">
                          {highlightText(granule.content_preview, query)}
                        </p>
                      </div>

                      {/* Métadonnées */}
                      <div className="text-xs text-gray-500 mb-4">
                        Par {granule.enseignant}
                      </div>

                      {/* Boutons d'action */}
                      <div className="mt-4 flex gap-2">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => router.push(`/granules/${granule.granule_id}`)}
                        >
                          Voir le granule
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/cours/${granule.cours.id}`)}
                        >
                          Voir le cours
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        ) : (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="text-center py-20">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Commencez votre recherche
              </h3>
              <p className="text-gray-500 mb-6">
                Entrez un terme pour rechercher dans les granules pédagogiques
              </p>

              {/* Suggestions */}
              <div className="max-w-md mx-auto">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Exemples de recherche :
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Fonction dérivée",
                    "Théorème de Pythagore",
                    "Équation chimique",
                    "Grammaire française",
                  ].map((example) => (
                    <Button
                      key={example}
                      variant="outline"
                      size="sm"
                      className="text-sm"
                      onClick={() => {
                        setQuery(example)
                        handleSearch()
                      }}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section aide */}
        {!hasSearched && (
          <div className="max-w-4xl mx-auto mt-8">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  🔍 Comment fonctionne la recherche ?
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    • Les granules sont des unités de contenu pédagogique
                    structurées
                  </p>
                  <p>
                    • Chaque granule contient une partie spécifique du cours
                  </p>
                  <p>
                    • La recherche parcourt titres, contenus et métadonnées
                  </p>
                  <p>
                    • Les résultats affichent le chemin complet dans le cours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}