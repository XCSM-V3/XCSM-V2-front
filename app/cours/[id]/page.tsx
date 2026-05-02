"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ChevronLeft,
  BookOpen,
  Users,
  Calendar,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  PlayCircle
} from "lucide-react"
import { api, Course, Etudiant } from "@/lib/api"

export default function CourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [course, setCourse] = useState<Course | null>(null)
  const [content, setContent] = useState<any>(null)
  const [students, setStudents] = useState<Etudiant[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    setUserRole(role)
    loadCourseData()
  }, [courseId])

  const loadCourseData = async () => {
    try {
      const data = await api.getCourse(courseId)
      setCourse(data)

      // Si propriétaire ou inscrit, charger le contenu détaillé
      if (data.est_proprietaire || data.est_inscrit) {
        const contentData = await api.getCourseContent(courseId)
        setContent(contentData)
      }

      // Si propriétaire, charger les étudiants
      if (data.est_proprietaire) {
        const studentsData = await api.getCourseStudents(courseId)
        setStudents(studentsData.etudiants)
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      await api.enrollInCourse(courseId)
      toast({
        title: "Inscription réussie !",
        description: "Vous avez rejoint ce cours avec succès.",
      })
      loadCourseData()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'inscription.",
        variant: "destructive",
      })
    } finally {
      setEnrolling(false)
    }
  }

  const handleUnenroll = async () => {

    try {
      await api.unenrollFromCourse(courseId)
      toast({
        title: "Désinscription réussie",
        description: "Vous avez quitté le cours.",
      })
      loadCourseData()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <SiteFooter />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="text-center py-12">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Cours introuvable</h2>
              <p className="text-muted-foreground mb-6">
                Le cours que vous recherchez n'existe pas ou a été supprimé.
              </p>
              <Button onClick={() => router.push("/cours")}>
                Retour au catalogue
              </Button>
            </CardContent>
          </Card>
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/cours")}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>

        {/* En-tête du cours */}
        <Card className="mb-6">
          {course.image && (
            <div className="h-48 w-full relative overflow-hidden rounded-t-lg bg-muted">
              <img
                src={course.image}
                alt={course.titre}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 mb-3">
                  {course.code}
                </Badge>
                <h1 className="text-3xl font-bold mb-2">
                  {course.titre}
                </h1>
                <p className="text-lg text-muted-foreground">{course.description}</p>
              </div>

              {course.est_inscrit && (
                <Badge className="bg-secondary text-secondary-foreground ml-4">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Inscrit
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span>{course.enseignant_nom}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{course.nb_etudiants} étudiants</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span>{course.nb_parties} parties</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>
                  Créé le {new Date(course.date_creation).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>

            {/* Boutons d'action */}
            {userRole === "etudiant" && (
              <div className="mt-6 flex gap-3">
                {course.est_inscrit ? (
                  <>
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => router.push(`/cours/${courseId}/lecture`)}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Commencer la lecture
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-red-300 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                        >
                          Se désinscrire
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmer la désinscription</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir vous désinscrire de ce cours ? Vous perdrez l'accès à l'ensemble de son contenu et à votre progression actuelle.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleUnenroll}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Oui, me désinscrire
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Inscription...
                      </>
                    ) : (
                      "S'inscrire à ce cours"
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Contenu du cours */}
        <Tabs defaultValue={searchParams.get("tab") || "overview"} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="content">Contenu</TabsTrigger>
            {course.est_proprietaire && (
              <TabsTrigger value="students">
                Étudiants ({students.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>À propos de ce cours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none dark:prose-invert">
                  <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                    {course.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {course.nb_etudiants}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        Étudiants inscrits
                      </div>
                    </div>

                    <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
                      <div className="text-3xl font-bold text-secondary-foreground mb-2">
                        {course.nb_parties}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        Parties de cours
                      </div>
                    </div>

                    <div className="bg-muted p-6 rounded-lg border border-border">
                      <div className="text-3xl font-bold mb-2">
                        {new Date(course.date_creation).getFullYear()}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        Année de création
                      </div>
                    </div>
                  </div>

                  {content && content.parties && (
                    <div className="mt-8">
                      <h3 className="text-xl font-bold mb-4">Structure du cours</h3>
                      <div className="space-y-4">
                        {content.parties.map((partie: any) => (
                          <div key={partie.id} className="border-l-4 border-primary pl-4 py-2">
                            <h4 className="font-semibold text-lg mb-2">{partie.titre}</h4>
                            <div className="pl-4 border-l-2 border-border ml-1 space-y-1">
                              {partie.chapitres && partie.chapitres.length > 0 ? (
                                partie.chapitres.map((chapitre: any) => (
                                  <p key={chapitre.id} className="text-sm text-muted-foreground">
                                    {chapitre.numero}. {chapitre.titre}
                                  </p>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground italic">Aucun chapitre</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Contenu du cours</CardTitle>
              </CardHeader>
              <CardContent>
                {!content ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {course.est_inscrit || course.est_proprietaire
                        ? "Chargement du contenu..."
                        : "Inscrivez-vous pour accéder au contenu détaillé du cours."}
                    </p>
                    {(course.est_inscrit || course.est_proprietaire) && (
                      <p className="text-xs text-red-400 mt-2">
                        Si le chargement persiste, le contenu MongoDB est peut-être manquant.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {content.parties.map((partie: any) => (
                      <div key={partie.id} className="space-y-6">
                        <div
                          onClick={() => router.push(`/contenu/${partie.id}?type=partie`)}
                          className="bg-primary/5 p-4 rounded-lg flex items-center justify-between border border-primary/10 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                        >
                          <h2 className="text-xl font-bold text-primary group-hover:underline">
                            {partie.titre}
                          </h2>
                          <Badge className="bg-primary">Partie {partie.numero}</Badge>
                        </div>

                        <div className="space-y-6 pl-4">
                          {partie.chapitres?.map((chapitre: any) => (
                            <div key={chapitre.id} className="space-y-4">
                              <h3
                                onClick={() => router.push(`/contenu/${chapitre.id}?type=chapitre`)}
                                className="text-lg font-bold border-b pb-2 flex items-center gap-2 hover:text-primary cursor-pointer transition-colors"
                              >
                                <span className="bg-muted text-muted-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">
                                  {chapitre.numero}
                                </span>
                                <span className="flex-1">{chapitre.titre}</span>
                                <Badge variant="outline" className="text-xs">
                                  Cliquer pour voir tout le chapitre
                                </Badge>
                              </h3>

                              <div className="space-y-4 pl-4">
                                {chapitre.sections?.map((section: any) => (
                                  <div key={section.id} className="space-y-3">
                                    <h4
                                      onClick={() => router.push(`/contenu/${section.id}?type=section`)}
                                      className="font-semibold text-muted-foreground flex items-center gap-2 hover:text-primary cursor-pointer transition-colors"
                                    >
                                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                                      <span className="flex-1">{section.titre}</span>
                                      <Badge variant="outline" className="text-xs">
                                        Voir section
                                      </Badge>
                                    </h4>

                                    <div className="space-y-2 pl-6">
                                      {section.sous_sections?.map((ss: any) => (
                                        <div key={ss.id} className="space-y-2">
                                          <p
                                            onClick={() => router.push(`/contenu/${ss.id}?type=sous_section`)}
                                            className="text-xs text-muted-foreground font-medium mb-2 hover:text-primary cursor-pointer transition-colors"
                                          >
                                            {ss.titre} →
                                          </p>
                                          {ss.granules?.map((granule: any) => (
                                            <div
                                              key={granule.id}
                                              onClick={() => router.push(`/granules/${granule.id}`)}
                                              className="p-4 bg-card border border-border rounded-lg shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                                            >
                                              <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                    <span className="text-sm font-medium text-primary group-hover:underline">
                                                      {granule.titre}
                                                    </span>
                                                  </div>
                                                  {granule.type === 'TEXTE' && granule.contenu?.content && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                      {granule.contenu.content}
                                                    </p>
                                                  )}
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                  {granule.type}
                                                </Badge>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {content.parties.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Ce cours n'a pas encore de contenu structuré.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {course.est_proprietaire && (
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Étudiants inscrits ({students.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Aucun étudiant inscrit pour le moment
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-4 bg-muted/40 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div>
                            <div className="font-medium">
                              {student.prenom} {student.nom}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {student.email}
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-background">
                            {student.niveau}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <SiteFooter />
    </div>
  )
}