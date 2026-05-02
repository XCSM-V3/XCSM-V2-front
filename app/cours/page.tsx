"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Search, BookOpen, Users, Calendar, Loader2 } from "lucide-react"
import { api, Course } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function CourseCatalogPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    setUserRole(role)
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const data = await api.getAllCourses()
      setCourses(data)
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadCourses()
      return
    }
    setIsLoading(true)
    try {
      const data = await api.getAllCourses({ search: searchQuery })
      setCourses(data)
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    try {
      await api.enrollInCourse(courseId)
      toast({
        title: "Inscription réussie !",
        description: "Vous êtes maintenant inscrit à ce cours. Redirection...",
      })
      router.push(`/cours/${courseId}`)
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Impossible de s'inscrire au cours.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Catalogue des cours
          </h1>
          <p className="text-lg text-muted-foreground">
            Explorez et inscrivez-vous aux cours disponibles
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mb-8 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un cours par titre, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleSearch}
            className="bg-green-600 hover:bg-green-700"
          >
            Rechercher
          </Button>
        </div>

        {/* Liste des cours */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          </div>
        ) : courses.length === 0 ? (
          <Card className="py-20 bg-card text-card-foreground border-border">
            <CardContent className="text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Aucun cours trouvé
              </h3>
              <p className="text-muted-foreground">
                Essayez une autre recherche ou revenez plus tard
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      {course.code}
                    </Badge>
                    {course.est_inscrit && (
                      <Badge className="bg-blue-100 text-blue-800">
                        Inscrit
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl line-clamp-2">
                    {course.titre}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {course.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Par {course.enseignant_nom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{course.nb_etudiants} étudiants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(course.date_creation).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/cours/${course.id}`)}
                  >
                    Voir le cours
                  </Button>
                  {userRole === "etudiant" && !course.est_inscrit && (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleEnroll(course.id)}
                    >
                      S'inscrire
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}