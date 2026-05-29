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
import { cn } from "@/lib/utils"
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
    ChevronDown,
    BookOpen,
    Users,
    Calendar,
    FileText,
    Loader2,
    CheckCircle,
    XCircle,
    PlayCircle,
    ChevronRight,
    Eye,
    ArrowRight
} from "lucide-react"
import { api, Course, Etudiant } from "@/lib/api"
import { useAnalytics } from "@/hooks/useAnalytics" // --- AJOUT MODULE 3 ---
import { useAuth } from "@/contexts/auth-context"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface Granule { id: string; titre: string; type: string; ordre: number; contenu: { html_content?: string; [key: string]: any } }
interface SousSection { id: string; titre: string; numero: number; granules: Granule[] }
interface Section { id: string; titre: string; numero: number; sous_sections: SousSection[] }
interface Chapitre { id: string; titre: string; numero: number; sections: Section[] }
interface Partie { id: string; titre: string; numero: number; chapitres: Chapitre[] }
interface CourseStructure { cours: { id: string; titre: string; description: string; enseignant: string }; parties: Partie[] }

function isUuidLike(value?: string | null) {
    if (!value) return false
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function toCourseStructure(data: any): CourseStructure | null {
    if (!data) return null

    // Format attendu (legacy): { cours, parties }
    if (data.cours && Array.isArray(data.parties)) {
        const legacy = data as CourseStructure
        const parties: Partie[] = (legacy.parties || []).map((p, pi) => ({
            ...p,
            chapitres: (p.chapitres || []).map((c, ci) => ({
                ...c,
                sections: (c.sections || []).map((s, si) => ({
                    ...s,
                    sous_sections: (s.sous_sections || []).map((ss, ssi) => ({
                        ...ss,
                        granules: (ss.granules || []).map((g, gi) => {
                            const realId = String(g.id)
                            const navId = `nav-${legacy.cours?.id ?? "cours"}-p${pi + 1}-c${ci + 1}-s${si + 1}-ss${ssi + 1}-g${gi + 1}`
                            return {
                                ...g,
                                id: navId,
                                _realId: isUuidLike(realId) ? realId : (g as any)._realId,
                                contenu: {
                                    ...g.contenu,
                                    html_content: g.contenu?.html_content || g.contenu?.html || g.contenu?.content || ""
                                }
                            } as any
                        }),
                    })),
                })),
            })),
        }))

        return { ...legacy, parties }
    }

    // Format XCCM backend: { id, title, sections: [{ title, chapters: [{ title, paragraphs: [{ title, content }] }] }] }
    if (data.id && data.title && Array.isArray(data.sections)) {
        const cours = {
            id: String(data.id),
            titre: String(data.title),
            description: String(data.introduction ?? data.description ?? ""),
            enseignant: String(data.author?.name ?? ""),
        }

        const parties: Partie[] = data.sections.map((sec: any, pi: number) => {
            const chapitres: Chapitre[] = (sec.chapters ?? []).map((ch: any, ci: number) => {
                const sections: Section[] = (ch.paragraphs ?? []).map((p: any, si: number) => {
                    const gId = `${data.id}-p${pi + 1}-c${ci + 1}-s${si + 1}`
                    const granule: Granule = {
                        id: gId,
                        titre: String(p.title ?? `Section ${si + 1}`),
                        type: "CONTENU",
                        ordre: si + 1,
                        contenu: { html_content: String(p.content ?? "") },
                        _realId: isUuidLike(p.granule_id) ? String(p.granule_id) : undefined,
                    } as any
                    return {
                        id: `${gId}-section`,
                        titre: String(p.title ?? `Section ${si + 1}`),
                        numero: si + 1,
                        sous_sections: [
                            {
                                id: `${gId}-ss`,
                                titre: "Contenu",
                                numero: 1,
                                granules: [granule],
                            },
                        ],
                    }
                })

                return {
                    id: `${data.id}-chap${ci + 1}-p${pi + 1}`,
                    titre: String(ch.title ?? `Chapitre ${ci + 1}`),
                    numero: ci + 1,
                    sections,
                }
            })

            return {
                id: `${data.id}-part${pi + 1}`,
                titre: String(sec.title ?? `Partie ${pi + 1}`),
                numero: pi + 1,
                chapitres,
            }
        })

        return { cours, parties }
    }

    return null
}

export default function CourseDetailPage() {
    const router = useRouter()
    const params = useParams()
    const courseId = params.id as string
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const { user } = useAuth()
    const isEnseignant = user?.role === "enseignant" || user?.role === "admin"

    const [course, setCourse] = useState<Course | null>(null)
    const [students, setStudents] = useState<Etudiant[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isEnrollLoading, setIsEnrollLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("apercu")
    const [structure, setStructure] = useState<CourseStructure | null>(null)
    const [isContentLoading, setIsContentLoading] = useState(true)
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!courseId) return
        setIsContentLoading(true)
        api.getCourseContent(courseId)
            .then(data => {
                const normalized = toCourseStructure(data)
                setStructure(normalized)
                if (normalized?.parties?.[0]?.chapitres?.[0]) {
                    setExpandedChapters(new Set([normalized.parties[0].chapitres[0].id]))
                }
            })
            .catch(err => {
                console.error("Erreur structure:", err)
            })
            .finally(() => {
                setIsContentLoading(false)
            })
    }, [courseId])

    const toggleChapter = (chapterId: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev)
            if (next.has(chapterId)) {
                next.delete(chapterId)
            } else {
                next.add(chapterId)
            }
            return next
        })
    }

    const getChapterGranules = (ch: Chapitre): Granule[] => {
        if (!ch.sections) return []
        const list: Granule[] = []
        ch.sections.forEach(s => {
            if (s.sous_sections) {
                s.sous_sections.forEach(ss => {
                    if (ss.granules) {
                        list.push(...ss.granules)
                    }
                })
            }
        })
        return list
    }

    const getGranuleHtml = (g: Granule): string => {
        if (!g.contenu) return ""
        return g.contenu.html_content || g.contenu.html || g.contenu.content || ""
    }

    // ==========================================================================
    // Module analytics : pas de tracking granule "page_overview"
    // La mesure se fait sur les pages `lecture` (granule réel).
    // ==========================================================================
    useAnalytics(courseId);

    useEffect(() => {
        // Si un onglet est spécifié dans l'URL, l'utiliser
        const tabParam = searchParams.get('tab')
        if (tabParam) {
            setActiveTab(tabParam)
        }
    }, [searchParams])

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                const data = await api.getCourse(courseId)
                setCourse(data)

                // Si l'utilisateur est le propriétaire, on charge la liste des étudiants
                if (data.est_proprietaire) {
                    const studentsData = await api.getCourseStudents(courseId)
                    setStudents(studentsData.etudiants || [])
                }
            } catch (error) {
                console.error("Erreur lors du chargement du cours:", error)
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les détails du cours",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourseDetails()
    }, [courseId, toast])

    const handleEnroll = async () => {
        setIsEnrollLoading(true)
        try {
            // Simuler l'inscription (à adapter avec votre API)
            await new Promise(resolve => setTimeout(resolve, 1000))

            setCourse(prev => prev ? { ...prev, est_inscrit: true } : null)
            toast({
                title: "Succès",
                description: "Vous êtes maintenant inscrit à ce cours",
            })
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de vous inscrire à ce cours",
                variant: "destructive",
            })
        } finally {
            setIsEnrollLoading(false)
        }
    }

    const handleStartCourse = () => {
        router.push(`/cours/${courseId}/lecture`)
    }

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col">
                <SiteHeader />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="flex h-screen flex-col">
                <SiteHeader />
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Cours introuvable</h2>
                    <p className="text-muted-foreground mb-6">
                        Le cours que vous recherchez n'existe pas ou vous n'y avez pas accès.
                    </p>
                    <Button onClick={() => router.push('/dashboard')}>
                        Retour au tableau de bord
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <SiteHeader />

            {/* En-tête du cours */}
            <div className="bg-primary/5 border-b">
                <div className="container py-8 md:py-12">
                    <Button
                        variant="ghost"
                        className="mb-6 -ml-4 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            if (course && course.matiere) {
                                router.push(`/dashboard/matieres/${course.matiere}`)
                            } else {
                                router.push('/dashboard/matieres')
                            }
                        }}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Retour au tableau de bord
                    </Button>

                    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                    {course.code || "Sans code"}
                                </Badge>
                                {course.est_inscrit && (
                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="mr-1 h-3 w-3" /> Inscrit
                                    </Badge>
                                )}
                                {course.est_proprietaire && (
                                    <Badge variant="outline" className="border-primary text-primary">
                                        Propriétaire
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.titre}</h1>

                            <p className="text-muted-foreground text-lg mb-6 line-clamp-2 max-w-3xl">
                                {course.description || "Aucune description fournie pour ce cours."}
                            </p>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>{course.nb_etudiants || 0} étudiants inscrits</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Mis à jour le {new Date(course.date_creation).toLocaleDateString('fr-FR')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center items-start md:items-end gap-4">
                            {course.est_inscrit || course.est_proprietaire || isEnseignant ? (
                                <Button size="lg" className="w-full md:w-auto" onClick={handleStartCourse}>
                                    <PlayCircle className="mr-2 h-5 w-5" />
                                    Ouvrir le cours
                                </Button>
                            ) : (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="lg" className="w-full md:w-auto">
                                            S'inscrire à ce cours
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmer l'inscription</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Voulez-vous vraiment vous inscrire au cours "{course.titre}" ?
                                                Cette action vous donnera accès à l'intégralité du contenu et aux outils d'IA.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleEnroll} disabled={isEnrollLoading}>
                                                {isEnrollLoading ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Inscription...</>
                                                ) : (
                                                    "Confirmer"
                                                )}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            {course.est_proprietaire && (
                                <Button variant="outline" className="w-full md:w-auto" onClick={() => router.push(`/mes-cours/${courseId}/parametres`)}>
                                    Gérer le cours
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <main className="container py-8 flex-1">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-8 overflow-x-auto flex-nowrap">
                        <TabsTrigger
                            value="apercu"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                        >
                            Aperçu
                        </TabsTrigger>
                        <TabsTrigger
                            value="contenu"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                        >
                            Programme
                        </TabsTrigger>
                        {course.est_proprietaire && (
                            <TabsTrigger
                                value="etudiants"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                            >
                                Étudiants inscrits
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="apercu" className="mt-0">
                        <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-xl font-bold mb-4">À propos de ce cours</h3>
                                    <div className="prose prose-slate max-w-none dark:prose-invert">
                                        <p className="whitespace-pre-wrap">{course.description || "Aucune description détaillée n'a été fournie pour ce cours."}</p>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xl font-bold mb-4">Ce que vous allez apprendre</h3>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {/* Exemples statiques d'objectifs, à rendre dynamiques plus tard */}
                                        {[
                                            "Comprendre les concepts fondamentaux",
                                            "Appliquer la théorie à des cas pratiques",
                                            "Utiliser les outils recommandés",
                                            "Évaluer des solutions existantes"
                                        ].map((obj, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                                <span>{obj}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Informations</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-sm">
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-muted-foreground">Enseignant</span>
                                            <span className="font-medium">{course.enseignant_nom || "Non défini"}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-muted-foreground">Matière</span>
                                            <span className="font-medium">{course.code || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-muted-foreground">Accès</span>
                                            <Badge variant={course.est_inscrit || course.est_proprietaire || isEnseignant ? "default" : "secondary"}>
                                                {course.est_inscrit || course.est_proprietaire || isEnseignant ? "Accès complet" : "Accès restreint"}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="contenu" className="mt-0">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    Structure du cours
                                </CardTitle>
                                {structure && structure.parties.length > 0 && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5 transition-all">
                                                <Eye className="h-4 w-4" />
                                                Aperçu complet du cours
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-8 rounded-2xl">
                                            <DialogHeader className="mb-6 border-b pb-4">
                                                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                                    <BookOpen className="h-6 w-6 text-primary" />
                                                    Aperçu complet : {course.titre}
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                                <div 
                                                    className="text-muted-foreground leading-relaxed text-base"
                                                    dangerouslySetInnerHTML={{ 
                                                        __html: structure.parties.flatMap((partie) => 
                                                            partie.chapitres.flatMap((chapitre) => 
                                                                chapitre.sections.flatMap((section) => 
                                                                    section.sous_sections.flatMap((ss) => 
                                                                        ss.granules.map((g) => getGranuleHtml(g))
                                                                    )
                                                                )
                                                            )
                                                        ).join("\n") || '<p class="italic text-muted-foreground/30 text-center py-8">Aucun contenu disponible pour l\'aperçu.</p>'
                                                    }} 
                                                />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </CardHeader>
                            <CardContent>
                                {isContentLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <p className="text-sm text-muted-foreground">Chargement du programme...</p>
                                    </div>
                                ) : structure ? (
                                    <div className="space-y-6">
                                        {structure.parties.map((partie, pi) => (
                                            <div key={partie.id} className="border border-border/60 rounded-xl p-4 bg-muted/10">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center bg-primary/10 text-primary">
                                                        {pi + 1}
                                                    </span>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                                        {partie.titre}
                                                    </h4>
                                                </div>

                                                <div className="space-y-3 md:pl-9">
                                                    {partie.chapitres.map((ch) => {
                                                        const isExpanded = expandedChapters.has(ch.id);
                                                        const granules = getChapterGranules(ch);
                                                        const granulesCount = granules.length;
                                                        return (
                                                            <div key={ch.id} className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm">
                                                                <button
                                                                    onClick={() => toggleChapter(ch.id)}
                                                                    className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors text-left"
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase shrink-0">
                                                                            Ch.{ch.numero}
                                                                        </span>
                                                                        <span className="font-medium text-xs truncate text-foreground">
                                                                            {ch.titre}
                                                                        </span>
                                                                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                                                            {granulesCount} granule{granulesCount > 1 ? "s" : ""}
                                                                        </Badge>
                                                                    </div>
                                                                    <ChevronDown
                                                                        className={cn(
                                                                            "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                                                            isExpanded && "rotate-180"
                                                                        )}
                                                                    />
                                                                </button>

                                                                {isExpanded && (
                                                                    <div className="border-t bg-muted/5 p-4 space-y-4">
                                                                        {ch.sections && ch.sections.length > 0 ? (
                                                                            ch.sections.map((section, si) => (
                                                                                <div key={section.id}>
                                                                                    {/* Section / Paragraphe */}
                                                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                                                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50" />
                                                                                        {section.titre || `Paragraphe ${si + 1}`}
                                                                                    </p>
                                                                                    <div className="space-y-1 pl-3 border-l border-border/50">
                                                                                        {section.sous_sections && section.sous_sections.length > 0 ? (
                                                                                            section.sous_sections.map((ss, ssi) => (
                                                                                                <div key={ss.id} className="space-y-1">
                                                                                                    {/* Sous-section si titre différent de la section */}
                                                                                                    {ss.titre && ss.titre !== section.titre && (
                                                                                                        <p className="text-[10px] text-muted-foreground font-medium italic pl-1 pt-1">
                                                                                                            {ss.titre}
                                                                                                        </p>
                                                                                                    )}
                                                                                                    {/* Granules / Notions */}
                                                                                                    {ss.granules && ss.granules.map(g => (
                                                                                                        <div
                                                                                                            key={g.id}
                                                                                                            className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/40 transition-colors"
                                                                                                        >
                                                                                                            <FileText className="h-3 w-3 text-primary/60 shrink-0" />
                                                                                                            <span className="text-xs text-foreground font-medium flex-1">
                                                                                                                {g.titre}
                                                                                                            </span>
                                                                                                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/20 text-primary/70">
                                                                                                                {g.type || "CONTENU"}
                                                                                                            </Badge>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            ))
                                                                                        ) : null}
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <>
                                                                                {granules.map(g => (
                                                                                    <div
                                                                                        key={g.id}
                                                                                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/40 transition-colors"
                                                                                    >
                                                                                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                                        <span className="text-xs text-foreground font-medium flex-1">
                                                                                            {g.titre}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                                {granulesCount === 0 && (
                                                                                    <p className="text-xs text-muted-foreground italic pl-3">Aucun contenu dans ce chapitre</p>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {structure.parties.length === 0 && (
                                            <div className="text-center py-12">
                                                <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                                <p className="text-muted-foreground">Aucune structure de cours disponible.</p>
                                            </div>
                                        )}

                                        <div className="flex justify-center pt-4">
                                            <Button size="lg" className="gap-2" onClick={handleStartCourse} disabled={!course.est_inscrit && !course.est_proprietaire && !isEnseignant}>
                                                Commencer la lecture
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                        <p className="text-muted-foreground">Le programme détaillé n'a pas pu être chargé.</p>
                                        <Button className="mt-6" onClick={handleStartCourse} disabled={!course.est_inscrit && !course.est_proprietaire && !isEnseignant}>
                                            Commencer la lecture
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {course.est_proprietaire && (
                        <TabsContent value="etudiants" className="mt-0">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Liste des étudiants inscrits ({students.length})</CardTitle>
                                    <Button variant="outline" size="sm">Exporter (CSV)</Button>
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



















// "use client"

// import { useState, useEffect } from "react"
// import { useRouter, useParams, useSearchParams } from "next/navigation"
// import { useToast } from "@/components/ui/use-toast"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Badge } from "@/components/ui/badge"
// import { SiteHeader } from "@/components/site-header"
// import { SiteFooter } from "@/components/site-footer"
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog"
// import {
//   ChevronLeft,
//   BookOpen,
//   Users,
//   Calendar,
//   FileText,
//   Loader2,
//   CheckCircle,
//   XCircle,
//   PlayCircle
// } from "lucide-react"
// import { api, Course, Etudiant } from "@/lib/api"

// export default function CourseDetailPage() {
//   const router = useRouter()
//   const params = useParams()
//   const courseId = params.id as string
//   const searchParams = useSearchParams()
//   const { toast } = useToast()

//   const [course, setCourse] = useState<Course | null>(null)
//   const [content, setContent] = useState<any>(null)
//   const [students, setStudents] = useState<Etudiant[]>([])
//   const [loading, setLoading] = useState(true)
//   const [userRole, setUserRole] = useState<string | null>(null)
//   const [enrolling, setEnrolling] = useState(false)

//   useEffect(() => {
//     const role = localStorage.getItem("userRole")
//     setUserRole(role)
//     loadCourseData()
//   }, [courseId])

//   const loadCourseData = async () => {
//     try {
//       const data = await api.getCourse(courseId)
//       setCourse(data)

//       // Si propriétaire ou inscrit, charger le contenu détaillé
//       if (data.est_proprietaire || data.est_inscrit) {
//         const contentData = await api.getCourseContent(courseId)
//         setContent(contentData)
//       }

//       // Si propriétaire, charger les étudiants
//       if (data.est_proprietaire) {
//         const studentsData = await api.getCourseStudents(courseId)
//         setStudents(studentsData.etudiants)
//       }
//     } catch (error) {
//       console.error("Erreur:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleEnroll = async () => {
//     setEnrolling(true)
//     try {
//       await api.enrollInCourse(courseId)
//       toast({
//         title: "Inscription réussie !",
//         description: "Vous avez rejoint ce cours avec succès.",
//       })
//       loadCourseData()
//     } catch (error: any) {
//       toast({
//         title: "Erreur",
//         description: error.message || "Une erreur est survenue lors de l'inscription.",
//         variant: "destructive",
//       })
//     } finally {
//       setEnrolling(false)
//     }
//   }

//   const handleUnenroll = async () => {

//     try {
//       await api.unenrollFromCourse(courseId)
//       toast({
//         title: "Désinscription réussie",
//         description: "Vous avez quitté le cours.",
//       })
//       loadCourseData()
//     } catch (error: any) {
//       toast({
//         title: "Erreur",
//         description: error.message,
//         variant: "destructive",
//       })
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex flex-col min-h-screen bg-background">
//         <SiteHeader />
//         <div className="flex-1 flex items-center justify-center">
//           <Loader2 className="h-12 w-12 animate-spin text-primary" />
//         </div>
//         <SiteFooter />
//       </div>
//     )
//   }

//   if (!course) {
//     return (
//       <div className="flex flex-col min-h-screen bg-background">
//         <SiteHeader />
//         <div className="flex-1 flex items-center justify-center">
//           <Card className="max-w-md w-full mx-4">
//             <CardContent className="text-center py-12">
//               <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
//               <h2 className="text-2xl font-bold mb-2">Cours introuvable</h2>
//               <p className="text-muted-foreground mb-6">
//                 Le cours que vous recherchez n'existe pas ou a été supprimé.
//               </p>
//               <Button onClick={() => router.push("/cours")}>
//                 Retour au catalogue
//               </Button>
//             </CardContent>
//           </Card>
//         </div>
//         <SiteFooter />
//       </div>
//     )
//   }

//   return (
//     <div className="flex flex-col min-h-screen bg-background">
//       <SiteHeader />

//       <main className="flex-1 container mx-auto px-4 py-8">
//         {/* Navigation */}
//         <div className="mb-6">
//           <Button
//             variant="outline"
//             onClick={() => router.push("/cours")}
//             className="gap-2"
//           >
//             <ChevronLeft className="h-4 w-4" />
//             Retour
//           </Button>
//         </div>

//         {/* En-tête du cours */}
//         <Card className="mb-6">
//           {course.image && (
//             <div className="h-48 w-full relative overflow-hidden rounded-t-lg bg-muted">
//               <img
//                 src={course.image}
//                 alt={course.titre}
//                 className="w-full h-full object-cover"
//               />
//             </div>
//           )}
//           <CardHeader>
//             <div className="flex items-start justify-between mb-4">
//               <div className="flex-1">
//                 <Badge className="bg-primary/20 text-primary hover:bg-primary/30 mb-3">
//                   {course.code}
//                 </Badge>
//                 <h1 className="text-3xl font-bold mb-2">
//                   {course.titre}
//                 </h1>
//                 <p className="text-lg text-muted-foreground">{course.description}</p>
//               </div>

//               {course.est_inscrit && (
//                 <Badge className="bg-secondary text-secondary-foreground ml-4">
//                   <CheckCircle className="h-4 w-4 mr-1" />
//                   Inscrit
//                 </Badge>
//               )}
//             </div>

//             <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
//               <div className="flex items-center gap-2">
//                 <BookOpen className="h-5 w-5" />
//                 <span>{course.enseignant_nom}</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Users className="h-5 w-5" />
//                 <span>{course.nb_etudiants} étudiants</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <FileText className="h-5 w-5" />
//                 <span>{course.nb_parties} parties</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Calendar className="h-5 w-5" />
//                 <span>
//                   Créé le {new Date(course.date_creation).toLocaleDateString("fr-FR")}
//                 </span>
//               </div>
//             </div>

//             {/* Boutons d'action */}
//             {userRole === "etudiant" && (
//               <div className="mt-6 flex gap-3">
//                 {course.est_inscrit ? (
//                   <>
//                     <Button
//                       className="bg-primary hover:bg-primary/90"
//                       onClick={() => router.push(`/cours/${courseId}/lecture`)}
//                     >
//                       <PlayCircle className="h-4 w-4 mr-2" />
//                       Commencer la lecture
//                     </Button>
//                     <AlertDialog>
//                       <AlertDialogTrigger asChild>
//                         <Button
//                           variant="outline"
//                           className="border-red-300 text-red-600 dark:text-red-400 hover:bg-red-500/10"
//                         >
//                           Se désinscrire
//                         </Button>
//                       </AlertDialogTrigger>
//                       <AlertDialogContent>
//                         <AlertDialogHeader>
//                           <AlertDialogTitle>Confirmer la désinscription</AlertDialogTitle>
//                           <AlertDialogDescription>
//                             Êtes-vous sûr de vouloir vous désinscrire de ce cours ? Vous perdrez l'accès à l'ensemble de son contenu et à votre progression actuelle.
//                           </AlertDialogDescription>
//                         </AlertDialogHeader>
//                         <AlertDialogFooter>
//                           <AlertDialogCancel>Annuler</AlertDialogCancel>
//                           <AlertDialogAction
//                             onClick={handleUnenroll}
//                             className="bg-red-600 hover:bg-red-700 text-white"
//                           >
//                             Oui, me désinscrire
//                           </AlertDialogAction>
//                         </AlertDialogFooter>
//                       </AlertDialogContent>
//                     </AlertDialog>
//                   </>
//                 ) : (
//                   <Button
//                     className="bg-primary hover:bg-primary/90"
//                     onClick={handleEnroll}
//                     disabled={enrolling}
//                   >
//                     {enrolling ? (
//                       <>
//                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         Inscription...
//                       </>
//                     ) : (
//                       "S'inscrire à ce cours"
//                     )}
//                   </Button>
//                 )}
//               </div>
//             )}
//           </CardHeader>
//         </Card>

//         {/* Contenu du cours */}
//         <Tabs defaultValue={searchParams.get("tab") || "overview"} className="space-y-6">
//           <TabsList>
//             <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
//             <TabsTrigger value="content">Contenu</TabsTrigger>
//             {course.est_proprietaire && (
//               <TabsTrigger value="students">
//                 Étudiants ({students.length})
//               </TabsTrigger>
//             )}
//           </TabsList>

//           <TabsContent value="overview">
//             <Card>
//               <CardHeader>
//                 <CardTitle>À propos de ce cours</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="prose max-w-none dark:prose-invert">
//                   <p className="text-muted-foreground text-lg leading-relaxed mb-6">
//                     {course.description}
//                   </p>

//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//                     <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
//                       <div className="text-3xl font-bold text-primary mb-2">
//                         {course.nb_etudiants}
//                       </div>
//                       <div className="text-sm text-muted-foreground font-medium">
//                         Étudiants inscrits
//                       </div>
//                     </div>

//                     <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
//                       <div className="text-3xl font-bold text-secondary-foreground mb-2">
//                         {course.nb_parties}
//                       </div>
//                       <div className="text-sm text-muted-foreground font-medium">
//                         Parties de cours
//                       </div>
//                     </div>

//                     <div className="bg-muted p-6 rounded-lg border border-border">
//                       <div className="text-3xl font-bold mb-2">
//                         {new Date(course.date_creation).getFullYear()}
//                       </div>
//                       <div className="text-sm text-muted-foreground font-medium">
//                         Année de création
//                       </div>
//                     </div>
//                   </div>

//                   {content && content.parties && (
//                     <div className="mt-8">
//                       <h3 className="text-xl font-bold mb-4">Structure du cours</h3>
//                       <div className="space-y-4">
//                         {content.parties.map((partie: any) => (
//                           <div key={partie.id} className="border-l-4 border-primary pl-4 py-2">
//                             <h4 className="font-semibold text-lg mb-2">{partie.titre}</h4>
//                             <div className="pl-4 border-l-2 border-border ml-1 space-y-1">
//                               {partie.chapitres && partie.chapitres.length > 0 ? (
//                                 partie.chapitres.map((chapitre: any) => (
//                                   <p key={chapitre.id} className="text-sm text-muted-foreground">
//                                     {chapitre.numero}. {chapitre.titre}
//                                   </p>
//                                 ))
//                               ) : (
//                                 <p className="text-sm text-muted-foreground italic">Aucun chapitre</p>
//                               )}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="content">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Contenu du cours</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {!content ? (
//                   <div className="text-center py-12">
//                     <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
//                     <p className="text-muted-foreground">
//                       {course.est_inscrit || course.est_proprietaire
//                         ? "Chargement du contenu..."
//                         : "Inscrivez-vous pour accéder au contenu détaillé du cours."}
//                     </p>
//                     {(course.est_inscrit || course.est_proprietaire) && (
//                       <p className="text-xs text-red-400 mt-2">
//                         Si le chargement persiste, le contenu MongoDB est peut-être manquant.
//                       </p>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="space-y-8">
//                     {content.parties.map((partie: any) => (
//                       <div key={partie.id} className="space-y-6">
//                         <div
//                           onClick={() => router.push(`/contenu/${partie.id}?type=partie`)}
//                           className="bg-primary/5 p-4 rounded-lg flex items-center justify-between border border-primary/10 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
//                         >
//                           <h2 className="text-xl font-bold text-primary group-hover:underline">
//                             {partie.titre}
//                           </h2>
//                           <Badge className="bg-primary">Partie {partie.numero}</Badge>
//                         </div>

//                         <div className="space-y-6 pl-4">
//                           {partie.chapitres?.map((chapitre: any) => (
//                             <div key={chapitre.id} className="space-y-4">
//                               <h3
//                                 onClick={() => router.push(`/contenu/${chapitre.id}?type=chapitre`)}
//                                 className="text-lg font-bold border-b pb-2 flex items-center gap-2 hover:text-primary cursor-pointer transition-colors"
//                               >
//                                 <span className="bg-muted text-muted-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">
//                                   {chapitre.numero}
//                                 </span>
//                                 <span className="flex-1">{chapitre.titre}</span>
//                                 <Badge variant="outline" className="text-xs">
//                                   Cliquer pour voir tout le chapitre
//                                 </Badge>
//                               </h3>

//                               <div className="space-y-4 pl-4">
//                                 {chapitre.sections?.map((section: any) => (
//                                   <div key={section.id} className="space-y-3">
//                                     <h4
//                                       onClick={() => router.push(`/contenu/${section.id}?type=section`)}
//                                       className="font-semibold text-muted-foreground flex items-center gap-2 hover:text-primary cursor-pointer transition-colors"
//                                     >
//                                       <div className="w-2 h-2 bg-primary rounded-full"></div>
//                                       <span className="flex-1">{section.titre}</span>
//                                       <Badge variant="outline" className="text-xs">
//                                         Voir section
//                                       </Badge>
//                                     </h4>

//                                     <div className="space-y-2 pl-6">
//                                       {section.sous_sections?.map((ss: any) => (
//                                         <div key={ss.id} className="space-y-2">
//                                           <p
//                                             onClick={() => router.push(`/contenu/${ss.id}?type=sous_section`)}
//                                             className="text-xs text-muted-foreground font-medium mb-2 hover:text-primary cursor-pointer transition-colors"
//                                           >
//                                             {ss.titre} →
//                                           </p>
//                                           {ss.granules?.map((granule: any) => (
//                                             <div
//                                               key={granule.id}
//                                               onClick={() => router.push(`/granules/${granule.id}`)}
//                                               className="p-4 bg-card border border-border rounded-lg shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer group"
//                                             >
//                                               <div className="flex items-start justify-between gap-3">
//                                                 <div className="flex-1">
//                                                   <div className="flex items-center gap-2 mb-2">
//                                                     <FileText className="h-4 w-4 text-primary" />
//                                                     <span className="text-sm font-medium text-primary group-hover:underline">
//                                                       {granule.titre}
//                                                     </span>
//                                                   </div>
//                                                   {granule.type === 'TEXTE' && granule.contenu?.content && (
//                                                     <p className="text-sm text-muted-foreground line-clamp-2">
//                                                       {granule.contenu.content}
//                                                     </p>
//                                                   )}
//                                                 </div>
//                                                 <Badge variant="outline" className="text-xs">
//                                                   {granule.type}
//                                                 </Badge>
//                                               </div>
//                                             </div>
//                                           ))}
//                                         </div>
//                                       ))}
//                                     </div>
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     ))}

//                     {content.parties.length === 0 && (
//                       <div className="text-center py-12">
//                         <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
//                         <p className="text-muted-foreground">
//                           Ce cours n'a pas encore de contenu structuré.
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {course.est_proprietaire && (
//             <TabsContent value="students">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>
//                     Étudiants inscrits ({students.length})
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   {students.length === 0 ? (
//                     <div className="text-center py-12">
//                       <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
//                       <p className="text-muted-foreground">
//                         Aucun étudiant inscrit pour le moment
//                       </p>
//                     </div>
//                   ) : (
//                     <div className="space-y-3">
//                       {students.map((student) => (
//                         <div
//                           key={student.id}
//                           className="flex items-center justify-between p-4 bg-muted/40 rounded-lg hover:bg-muted transition-colors"
//                         >
//                           <div>
//                             <div className="font-medium">
//                               {student.prenom} {student.nom}
//                             </div>
//                             <div className="text-sm text-muted-foreground">
//                               {student.email}
//                             </div>
//                           </div>
//                           <Badge variant="outline" className="bg-background">
//                             {student.niveau}
//                           </Badge>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </TabsContent>
//           )}
//         </Tabs>
//       </main>

//       <SiteFooter />
//     </div>
//   )
// }