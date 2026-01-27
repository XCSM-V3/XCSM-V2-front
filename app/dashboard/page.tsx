"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Users,
  FileText,
  TrendingUp,
  Plus,
  Loader2,
  Calendar,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { api, Course } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalParties: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadDashboardData()
    }
  }, [authLoading, isAuthenticated])

  const loadDashboardData = async () => {
    try {
      // Charger les cours depuis l'API
      const coursData = await api.getMyCourses()
      setCourses(coursData.slice(0, 6)) // Limiter à 6 cours récents

      // Calculer les stats RÉELLES depuis les données API
      const totalCourses = coursData.length
      const totalStudents = coursData.reduce((sum, c) => sum + c.nb_etudiants, 0)
      const totalParties = coursData.reduce((sum, c) => sum + c.nb_parties, 0)

      setStats({
        totalCourses,
        totalStudents,
        totalParties,
      })
    } catch (error) {
      console.error("Erreur chargement dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    description
  }: any) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Bienvenue, {user?.prenom} {user?.nom} 👋
        </h1>
        <p className="text-muted-foreground">
          {user?.role === "enseignant"
            ? "Voici un aperçu de vos cours et activités"
            : "Voici vos cours et votre progression"}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Mes cours"
          value={stats.totalCourses}
          icon={BookOpen}
          color="bg-primary"
          description={
            user?.role === "enseignant"
              ? "Cours créés"
              : "Cours suivis"
          }
        />

        {user?.role === "enseignant" && (
          <StatCard
            title="Étudiants"
            value={stats.totalStudents}
            icon={Users}
            color="bg-blue-600"
            description="Inscrits à vos cours"
          />
        )}

        <StatCard
          title="Parties de cours"
          value={stats.totalParties}
          icon={FileText}
          color="bg-purple-600"
          description="Contenus disponibles"
        />
      </div>

      {/* Actions rapides */}
      {user?.role === "enseignant" && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary mb-1">
                  Actions rapides
                </h3>
                <p className="text-sm text-primary/80">
                  Créez du contenu en quelques clics
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => router.push("/creer-cours")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau cours
                </Button>
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={() => router.push("/importer-document")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Importer un document
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cours récents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Cours récents</h2>
            <p className="text-sm text-muted-foreground">
              Vos {courses.length} derniers cours
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/mes-cours")}
            className="gap-2"
          >
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-20">
              <BookOpen className="h-16 w-16 text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Aucun cours
              </h3>
              <p className="text-muted-foreground mb-6">
                {user?.role === "enseignant"
                  ? "Commencez par créer votre premier cours"
                  : "Explorez le catalogue pour vous inscrire à des cours"}
              </p>
              {user?.role === "enseignant" ? (
                <Button
                  className="bg-primary hover:bg-primary/90"
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
            {courses.map((course) => (
              <Card
                key={course.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/cours/${course.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                      {course.code}
                    </Badge>
                    {user?.role === "etudiant" && (
                      <Badge className="bg-blue-100 text-blue-800">
                        Inscrit
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg line-clamp-2">
                    {course.titre}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {user?.role === "enseignant" && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{course.nb_etudiants}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>{course.nb_parties} parties</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(course.date_creation).toLocaleDateString("fr-FR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section activité récente */}
      {user?.role === "enseignant" && courses.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.slice(0, 3).map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{course.titre}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.nb_etudiants} étudiants • Mis à jour le{" "}
                        {new Date(course.date_creation).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/cours/${course.id}`)}
                  >
                    Voir
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}