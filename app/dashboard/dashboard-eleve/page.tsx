"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, FileText, Search } from "lucide-react"
import Link from "next/link"
import { api, Course } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface MockCourse extends Course {
  tags: string[]
}

export default function DashboardElevePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [courses, setCourses] = useState<MockCourse[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true)
      try {
        const data = await api.getMyCourses()
        // Convertir les types API vers les types attendus par le composant
        const formattedCourses: MockCourse[] = data.map((c: any) => ({
          ...c,
          title: c.titre,
          teacher_name: c.enseignant_nom || "Enseignant",
          progress: c.progress || 0,
          lastAccessed: c.last_accessed || null,
          tags: [], // Tags non gérés pour l'instant au niveau cours
        }))
        setCourses(formattedCourses)
      } catch (error) {
        console.error("Erreur lors du chargement des cours:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [])

  // Filtrer les cours en fonction de la recherche
  const filteredCourses = courses.filter(
    (course) =>
      course.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.enseignant_nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Séparer les cours en cours et les cours non commencés
  const inProgressCourses = filteredCourses.filter((course) => (course.progress || 0) > 0)
  const notStartedCourses = filteredCourses.filter((course) => (course.progress || 0) === 0)

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/recherche-granules">
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Link>
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white" asChild>
            <Link href="/rejoindre-cours">Rejoindre un cours</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-green-100 dark:border-green-900 bg-card text-card-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Cours suivis</CardTitle>
            <CardDescription>Nombre total de cours auxquels vous êtes inscrit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-green-600 dark:text-green-400 mr-4" />
              <span className="text-3xl font-bold">{courses.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100 dark:border-green-900 bg-card text-card-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Progression moyenne</CardTitle>
            <CardDescription>Votre progression moyenne sur tous les cours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Progression</span>
                <span className="text-sm font-medium">
                  {Math.round(courses.reduce((acc, course) => acc + (course.progress || 0), 0) / Math.max(courses.length, 1))}%
                </span>
              </div>
              <Progress
                value={Math.round(
                  courses.reduce((acc, course) => acc + (course.progress || 0), 0) / Math.max(courses.length, 1),
                )}
                className="h-2 bg-green-100 dark:bg-green-900/30"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100 dark:border-green-900 bg-card text-card-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Dernier accès</CardTitle>
            <CardDescription>Votre dernière activité sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600 dark:text-green-400 mr-4" />
              <span className="text-sm text-muted-foreground">
                {courses.some((course) => course.last_accessed)
                  ? new Date(
                    Math.max(
                      ...courses
                        .filter((course) => course.last_accessed)
                        .map((course) => new Date(course.last_accessed!).getTime()),
                    ),
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  : "Aucune activité récente"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un cours..."
          className="pl-10 border-green-200 dark:border-green-800 focus:border-green-300 focus:ring-green-300 dark:bg-background"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="in-progress">
        <TabsList className="mb-6">
          <TabsTrigger value="in-progress">En cours ({inProgressCourses.length})</TabsTrigger>
          <TabsTrigger value="not-started">Non commencés ({notStartedCourses.length})</TabsTrigger>
          <TabsTrigger value="all">Tous ({filteredCourses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress">
          <CourseGrid courses={inProgressCourses} showProgress />
        </TabsContent>

        <TabsContent value="not-started">
          <CourseGrid courses={notStartedCourses} />
        </TabsContent>

        <TabsContent value="all">
          <CourseGrid courses={filteredCourses} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CourseGrid({
  courses,
  showProgress = false,
}: {
  courses: MockCourse[]
  showProgress?: boolean
}) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucun cours trouvé</h3>
        <p className="text-muted-foreground mb-4">Aucun cours ne correspond à vos critères.</p>
        <Button className="bg-green-600 hover:bg-green-700 text-white" asChild>
          <Link href="/rejoindre-cours">Rejoindre un cours</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden border border-green-100 dark:border-green-900 hover:shadow-lg transition-all dark:bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{course.titre}</CardTitle>
            <CardDescription>Par {course.enseignant_nom}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {course.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                  {tag}
                </Badge>
              ))}
            </div>
            {showProgress ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Progression</span>
                  <span className="text-sm font-medium">{course.progress || 0}%</span>
                </div>
                <Progress value={course.progress || 0} className="h-2 bg-green-100 dark:bg-green-900/30" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {(course.progress || 0) === 0
                  ? "Vous n'avez pas encore commencé ce cours."
                  : `Progression: ${course.progress || 0}%`}
              </p>
            )}
          </CardContent>
          <div className="p-4 border-t border-green-100 dark:border-green-900">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white" asChild>
              <Link href={`/cours/${course.id}`}>{(course.progress || 0) > 0 ? "Continuer" : "Commencer"}</Link>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
