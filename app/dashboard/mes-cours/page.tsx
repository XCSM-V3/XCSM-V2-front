"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Plus,
  Search,
  Settings,
  Users,
  BookOpen,
  Calendar,
  Loader2,
  Trash2
} from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { api, Course } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

export default function MesCoursPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; titre: string } | null>(null)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchCourses()
    }
  }, [authLoading, isAuthenticated])

  const fetchCourses = async () => {
    setIsLoading(true)
    try {
      const data = await api.getMyCourses()
      setCourses(data)
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (courseId: string, titre: string) => {
    setCourseToDelete({ id: courseId, titre })
  }

  const { toast } = useToast()

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return

    try {
      await api.deleteCourse(courseToDelete.id)

      toast({
        title: "Cours supprimé",
        description: "Le cours a été supprimé avec succès.",
      })

      fetchCourses()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le cours",
        variant: "destructive"
      })
    } finally {
      setCourseToDelete(null)
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Mes cours</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mes cours</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === "enseignant"
              ? "Gérez vos cours et créez du contenu"
              : "Vos cours et votre progression"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push("/recherche-granules")}
          >
            <Search className="h-4 w-4" />
            Rechercher
          </Button>
          {user?.role === "enseignant" && (
            <Button
              className="bg-green-600 hover:bg-green-700 gap-2"
              onClick={() => router.push("/creer-cours")}
            >
              <Plus className="h-4 w-4" />
              Créer un cours
            </Button>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          placeholder="Rechercher un cours..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Liste des cours */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-20">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "Aucun cours trouvé" : "Aucun cours"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {user?.role === "enseignant"
                ? "Commencez par créer votre premier cours"
                : "Explorez le catalogue pour vous inscrire à des cours"}
            </p>
            {user?.role === "enseignant" ? (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => router.push("/creer-cours")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer un cours
              </Button>
            ) : (
              <Button onClick={() => router.push("/cours")}>
                Voir le catalogue
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="hover:shadow-xl transition-shadow border-border"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                    {course.code}
                  </Badge>
                  {user?.role === "etudiant" && (
                    <Badge className="bg-secondary text-secondary-foreground">
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
                  {user?.role === "enseignant" && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{course.nb_etudiants} étudiants</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{course.nb_parties} parties</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(course.date_creation).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  {user?.role === "etudiant" && (
                    <div className="pt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Progression</span>
                        <span className="font-medium">{course.progress || 0}%</span>
                      </div>
                      <Progress value={course.progress || 0} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-primary/20 hover:bg-primary/10 text-primary"
                  asChild
                >
                  <Link href={`/cours/${course.id}`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Voir
                  </Link>
                </Button>

                {user?.role === "enseignant" && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-primary/20 hover:bg-primary/10 text-primary"
                      onClick={() => router.push(`/mes-cours/${course.id}/parametres`)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-destructive/20 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(course.id, course.titre)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer le cours "{courseToDelete?.titre}".
              Cette action est irréversible et supprimera tout le contenu associé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteCourse}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}