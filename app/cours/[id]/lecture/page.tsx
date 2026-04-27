"use client"

import CommentsPanel from "@/components/comments/CommentsPanel"
import NotificationsBell from "@/components/comments/NotificationsBell"
import { useGranuleContext } from "@/hooks/useGranuleContext"
import { useAnalytics } from "@/hooks/useAnalytics"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import {
    ChevronLeft,
    ChevronRight,
    Menu,
    BookOpen,
    Download,
    FileText,
    CheckCircle2,
    PlayCircle,
    Loader2,
    MessageSquare,
    X,              // ← AJOUT : pour le bouton fermer panneau
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { exportCourseToWord } from "@/lib/docx-export"

interface Granule {
    id: string
    titre: string
    type: string
    ordre: number
    contenu: {
        html_content?: string
        [key: string]: any
    }
}
interface SousSection { id: string; titre: string; numero: number; granules: Granule[] }
interface Section { id: string; titre: string; numero: number; sous_sections: SousSection[] }
interface Chapitre { id: string; titre: string; numero: number; sections: Section[] }
interface Partie { id: string; titre: string; numero: number; chapitres: Chapitre[] }
interface CourseStructure {
    cours: { id: string; titre: string; description: string; enseignant: string }
    parties: Partie[]
}

export default function CourseViewerPage() {
    const { id } = useParams()
    const router = useRouter()
    const { user } = useAuth()

    const [structure, setStructure] = useState<CourseStructure | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedGranuleId, setSelectedGranuleId] = useState<string | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [activeCollection, setActiveCollection] = useState<{ title: string; granules: Granule[] } | null>(null)
    const [showComments, setShowComments] = useState(false)

    // ── Liste plate des granules ──────────────────────────────────
    const flatGranules = useMemo(() => {
        if (!structure) return []
        const granules: Granule[] = []
        structure.parties.forEach(p =>
            p.chapitres.forEach(c =>
                c.sections.forEach(s =>
                    s.sous_sections.forEach(ss => granules.push(...ss.granules))
                )
            )
        )
        return granules
    }, [structure])

    const currentIndex = flatGranules.findIndex(g => g.id === selectedGranuleId)
    const currentGranule = flatGranules[currentIndex]

    // ── Analytics tracking ────────────────────────────────────────
    const { trackAIQuestion } = useAnalytics({
        course_id: id as string,
        granule_id: currentGranule?.id,
        granule_title: currentGranule?.titre,
    })

    // ── Contexte IA (un seul appel — doublon supprimé) ────────────
    useGranuleContext(
        structure && currentGranule
            ? {
                courseId: structure.cours.id,
                courseTitle: structure.cours.titre,
                notionTitle: currentGranule.titre,
                notionContent: currentGranule.contenu?.html_content ?? "",
                level: "notion",
            }
            : {
                courseId: (id as string) ?? "",
                courseTitle: structure?.cours.titre ?? "Cours",
                level: "cours",
            }
    )

    // ── Chargement du cours ───────────────────────────────────────
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const data = await api.getCourseContent(id as string)
                setStructure(data)
                const first = data.parties?.[0]?.chapitres?.[0]?.sections?.[0]?.sous_sections?.[0]?.granules?.[0]
                if (first) setSelectedGranuleId(first.id)
            } catch {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger le contenu du cours." })
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchContent()
    }, [id])

    // ── Navigation ────────────────────────────────────────────────
    const goToNext = () => {
        if (currentIndex < flatGranules.length - 1) {
            setSelectedGranuleId(flatGranules[currentIndex + 1].id)
            setActiveCollection(null)
        }
    }
    const goToPrev = () => {
        if (currentIndex > 0) {
            setSelectedGranuleId(flatGranules[currentIndex - 1].id)
            setActiveCollection(null)
        }
    }

    // ── Tracker progression étudiant ─────────────────────────────
    useEffect(() => {
        if (id && selectedGranuleId && user?.role === "etudiant")
            api.trackProgression(id as string, selectedGranuleId).catch(console.error)
    }, [id, selectedGranuleId, user])

    // ── Export DOCX ───────────────────────────────────────────────
    const handleExport = async () => {
        if (!structure) return
        try {
            toast({ title: "Export en cours", description: "Génération DOCX..." })
            await exportCourseToWord(structure)
            toast({ title: "Succès", description: "Cours exporté avec succès." })
        } catch {
            toast({ variant: "destructive", title: "Erreur", description: "L'export a échoué." })
        }
    }

    // ── Logique collection ────────────────────────────────────────
    const collectGranules = (container: any, type: "chapitre" | "section" | "sous_section" | "partie") => {
        const out: Granule[] = []
        if (type === "partie")
            container.chapitres.forEach((c: any) => c.sections.forEach((s: any) => s.sous_sections.forEach((ss: any) => out.push(...ss.granules))))
        else if (type === "chapitre")
            container.sections.forEach((s: any) => s.sous_sections.forEach((ss: any) => out.push(...ss.granules)))
        else if (type === "section")
            container.sous_sections.forEach((ss: any) => out.push(...ss.granules))
        else if (type === "sous_section")
            out.push(...container.granules)
        return out
    }
    const handleHeaderClick = (container: any, type: "chapitre" | "section" | "sous_section" | "partie") => {
        const granules = collectGranules(container, type)
        if (granules.length > 0) setActiveCollection({ title: container.titre, granules })
        else toast({ title: "Info", description: "Aucun contenu dans cette section." })
    }

    // ── États ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse font-medium">Chargement du contenu...</p>
                </div>
            </div>
        )
    }
    if (!structure) return null

    const granulesToDisplay = activeCollection ? activeCollection.granules : (currentGranule ? [currentGranule] : [])
    const displayTitle = activeCollection ? activeCollection.title : (currentGranule?.titre || "")

    // ─────────────────────────────────────────────────────────────
    // RENDU PRINCIPAL
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="flex h-screen bg-background overflow-hidden">

            {/* ══════════════════════════════════════════════════════
                SIDEBAR TOC — inchangée
            ══════════════════════════════════════════════════════ */}
            <div className={cn(
                "border-r bg-muted/30 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0",
                isSidebarOpen ? "w-80" : "w-0 opacity-0 pointer-events-none"
            )}>
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />Sommaire
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {structure.parties.map(partie => (
                            <div key={partie.id} className="space-y-2">
                                <h3 className="font-bold text-primary flex items-center gap-2 cursor-pointer hover:underline"
                                    onClick={() => handleHeaderClick(partie, "partie")}>
                                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">P{partie.numero}</span>
                                    {partie.titre}
                                </h3>
                                <div className="pl-2 space-y-3 border-l-2 border-muted border-dashed ml-2">
                                    {partie.chapitres.map(chapitre => (
                                        <div key={chapitre.id} className="space-y-1">
                                            <button onClick={() => handleHeaderClick(chapitre, "chapitre")}
                                                className="w-full text-left font-semibold text-sm text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                                Ch.{chapitre.numero} : {chapitre.titre}
                                            </button>
                                            <div className="pl-4 space-y-1">
                                                {chapitre.sections.map(section => (
                                                    <div key={section.id} className="space-y-1">
                                                        <button onClick={() => handleHeaderClick(section, "section")}
                                                            className="w-full text-left font-medium text-xs text-muted-foreground hover:text-primary transition-colors">
                                                            {section.titre}
                                                        </button>
                                                        {section.sous_sections.map(ss => (
                                                            <div key={ss.id} className="space-y-0.5">
                                                                <button onClick={() => handleHeaderClick(ss, "sous_section")}
                                                                    className="w-full text-left text-[10px] uppercase font-bold text-muted-foreground/70 hover:text-primary mt-2 mb-1">
                                                                    {ss.titre}
                                                                </button>
                                                                {ss.granules.map(granule => (
                                                                    <button key={granule.id}
                                                                        onClick={() => { setSelectedGranuleId(granule.id); setActiveCollection(null) }}
                                                                        className={cn(
                                                                            "w-full text-left text-xs py-1.5 px-2 rounded-md transition-colors flex items-start gap-2",
                                                                            selectedGranuleId === granule.id && !activeCollection
                                                                                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                                                                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                                                        )}>
                                                                        <div className="mt-0.5">
                                                                            {granule.type === "CONTENU" ? <FileText className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                                                                        </div>
                                                                        <span className="flex-1 leading-tight">{granule.titre}</span>
                                                                        {selectedGranuleId === granule.id && !activeCollection && <CheckCircle2 className="h-3 w-3 mt-0.5" />}
                                                                    </button>
                                                                ))}
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
                </ScrollArea>
            </div>

            {/* ══════════════════════════════════════════════════════
                MODIFICATION 1 (ÉTAPE 4) :
                "flex-1 flex flex-col min-w-0" → "flex-1 flex min-w-0"
                La zone principale devient un conteneur HORIZONTAL
                pour accueillir le panneau commentaires à droite.
            ══════════════════════════════════════════════════════ */}
            <div className="flex-1 flex min-w-0 bg-background overflow-hidden">

                {/* Zone contenu cours — flex-col comme avant */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                    {/* ── HEADER ───────────────────────────────────
                        MODIFICATION 2 :
                        Ajout de <NotificationsBell /> et du bouton
                        "Discussions" dans la div des actions à droite,
                        juste AVANT le bouton "Quitter".
                    ─────────────────────────────────────────────── */}
                    <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur sticky top-0 z-10 flex-shrink-0">
                        <div className="flex items-center gap-4 min-w-0">
                            {!isSidebarOpen && (
                                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                                    <Menu className="h-5 w-5" />
                                </Button>
                            )}
                            <h1 className="font-semibold truncate text-foreground flex items-center gap-2">
                                {activeCollection ? (
                                    <>
                                        <span className="opacity-50 font-normal hidden sm:inline">Vue d'ensemble :</span>
                                        {displayTitle}
                                    </>
                                ) : structure.cours.titre}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleExport} className="hidden sm:flex">
                                <Download className="h-4 w-4 mr-2" />DOCX
                            </Button>

                            {/* ── AJOUT : Cloche notifications ── */}
                            <NotificationsBell />

                            {/* ── AJOUT : Bouton Discussions ─────
                                Devient "default" (fond vert) quand
                                le panneau est ouvert, "outline" sinon
                            ──────────────────────────────────────── */}
                            <Button
                                variant={showComments ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowComments(v => !v)}
                            >
                                <MessageSquare className="h-4 w-4 mr-1.5" />
                                <span className="hidden sm:inline">Discussions</span>
                            </Button>

                            <Button variant="ghost" size="sm" onClick={() => router.push(`/cours/${id}`)}>
                                Quitter
                            </Button>
                        </div>
                    </header>

                    {/* ── Contenu principal — inchangé ─────────── */}
                    <main className="flex-1 overflow-y-auto">
                        <div className="max-w-4xl mx-auto px-6 py-12">
                            {granulesToDisplay.length > 0 ? (
                                <div className="space-y-12 h-full">
                                    {activeCollection && (
                                        <div className="mb-12 border-b pb-6">
                                            <h1 className="text-4xl font-extrabold text-primary">{activeCollection.title}</h1>
                                            <p className="text-muted-foreground mt-2">{activeCollection.granules.length} éléments de lecture</p>
                                        </div>
                                    )}
                                    {granulesToDisplay.map(g => (
                                        <div key={g.id} className={cn("mb-4", !activeCollection && "border-b pb-8")}>
                                            {(!activeCollection || g.type !== "CONTENU") && (
                                                <div className="mb-4">
                                                    <h2 className="text-2xl font-bold text-foreground">{g.titre}</h2>
                                                </div>
                                            )}
                                            <div
                                                className={cn(
                                                    "rich-text-content prose prose-slate dark:prose-invert max-w-none",
                                                    activeCollection ? "text-lg leading-relaxed" : ""
                                                )}
                                                dangerouslySetInnerHTML={{ __html: g.contenu.html_content || "" }}
                                            />
                                        </div>
                                    ))}
                                    <div className="h-32" />
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
                                    <BookOpen className="h-12 w-12 opacity-20" />
                                    <p>Sélectionnez un chapitre ou une section pour lire.</p>
                                </div>
                            )}
                        </div>
                    </main>

                    {/* ── Footer navigation — inchangé ─────────── */}
                    {!activeCollection && (
                        <footer className="h-16 border-t bg-background/95 backdrop-blur flex items-center justify-between px-6 sticky bottom-0 flex-shrink-0">
                            <Button variant="ghost" onClick={goToPrev} disabled={currentIndex <= 0} className="gap-2">
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Précédent</span>
                            </Button>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden hidden md:block">
                                    <div className="h-full bg-primary transition-all duration-500"
                                        style={{ width: `${((currentIndex + 1) / flatGranules.length) * 100}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">
                                    {currentIndex + 1} / {flatGranules.length}
                                </span>
                            </div>
                            <Button
                                variant={currentIndex < flatGranules.length - 1 ? "default" : "outline"}
                                onClick={goToNext}
                                disabled={currentIndex >= flatGranules.length - 1}
                                className="gap-2"
                            >
                                <span className="hidden sm:inline">Suivant</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </footer>
                    )}
                </div>
                {/* ── FIN zone contenu cours ───────────────────── */}

                {/* ══════════════════════════════════════════════════
                    MODIFICATION 3 (RÉSULTAT FINAL) :
                    Panneau Discussions latéral — NOUVEAU BLOC
                    Rendu uniquement si showComments = true
                    ET un granule est sélectionné (pas en mode collection)
                ══════════════════════════════════════════════════ */}
                {showComments && currentGranule && (
                    <div className="w-80 xl:w-96 border-l border-border flex flex-col bg-background flex-shrink-0">

                        {/* Header panneau */}
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold text-foreground">Discussions</span>
                            </div>
                            <button
                                onClick={() => setShowComments(false)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                aria-label="Fermer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* CommentsPanel scrollable */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <CommentsPanel
                                granuleId={currentGranule.id}
                                courseId={id as string}
                                compact={true}
                            />
                        </div>
                    </div>
                )}

            </div>
            {/* ── FIN zone principale ──────────────────────────── */}

        </div>
    )
}










// "use client"


// import CommentsPanel from "@/components/comments/CommentsPanel"
// import NotificationsBell from "@/components/comments/NotificationsBell"

// import { useGranuleContext } from "@/hooks/useGranuleContext"
// import { useAnalytics } from "@/hooks/useAnalytics"  // ← NOUVEAU

// import { useState, useEffect, useMemo } from "react"
// import { useParams, useRouter } from "next/navigation"
// import { api } from "@/lib/api"
// import { useAuth } from "@/hooks/use-api"
// import { Button } from "@/components/ui/button"
// import {
//     ChevronLeft,
//     ChevronRight,
//     Menu,
//     BookOpen,
//     Download,
//     FileText,
//     CheckCircle2,
//     PlayCircle,
//     Loader2,
//     MessageSquare
// } from "lucide-react"
// import { toast } from "@/components/ui/use-toast"
// import { cn } from "@/lib/utils"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { exportCourseToWord } from "@/lib/docx-export"

// interface Granule {
//     id: string
//     titre: string
//     type: string
//     ordre: number
//     contenu: {
//         html_content?: string
//         [key: string]: any
//     }
// }

// interface SousSection {
//     id: string
//     titre: string
//     numero: number
//     granules: Granule[]
// }

// interface Section {
//     id: string
//     titre: string
//     numero: number
//     sous_sections: SousSection[]
// }

// interface Chapitre {
//     id: string
//     titre: string
//     numero: number
//     sections: Section[]
// }

// interface Partie {
//     id: string
//     titre: string
//     numero: number
//     chapitres: Chapitre[]
// }

// interface CourseStructure {
//     cours: {
//         id: string
//         titre: string
//         description: string
//         enseignant: string
//     }
//     parties: Partie[]
// }

// export default function CourseViewerPage() {
//     const { id } = useParams()
//     const router = useRouter()
//     const { user } = useAuth()
//     const [structure, setStructure] = useState<CourseStructure | null>(null)
//     const [loading, setLoading] = useState(true)
//     const [selectedGranuleId, setSelectedGranuleId] = useState<string | null>(null)
//     const [isSidebarOpen, setIsSidebarOpen] = useState(true)


//     // --- NOUVEAU: Gestion du mode "Collection" (Vue Chapitre complet) ---
//     const [activeCollection, setActiveCollection] = useState<{ title: string, granules: Granule[] } | null>(null)

//     const [showComments, setShowComments] = useState(false)



//     // Liste plate des granulés pour la navigation (Précédent/Suivant)
//     const flatGranules = useMemo(() => {
//         if (!structure) return []
//         const granules: Granule[] = []
//         structure.parties.forEach(p => {
//             p.chapitres.forEach(c => {
//                 c.sections.forEach(s => {
//                     s.sous_sections.forEach(ss => {
//                         granules.push(...ss.granules)
//                     })
//                 })
//             })
//         })
//         return granules
//     }, [structure])



//     const currentIndex = flatGranules.findIndex(g => g.id === selectedGranuleId)
//     const currentGranule = flatGranules[currentIndex]


//     // ── NOUVEAU : Analytics tracking ─────────────────────────────
//     const { trackAIQuestion } = useAnalytics({
//         course_id: id as string,
//         granule_id: currentGranule?.id,
//         granule_title: currentGranule?.titre,
//     })

//     // ── NOUVEAU : Context pour l'agent IA ─────────────────────────────
//     // On utilise le contexte pour fournir au chat les infos du chapitre/cours
//     // sans avoir à les passer manuellement à chaque fois
//     useGranuleContext(
//         structure && currentGranule
//             ? {
//                 courseId: structure.cours.id,
//                 courseTitle: structure.cours.titre,
//                 notionTitle: currentGranule.titre,
//                 notionContent: currentGranule.contenu?.html_content ?? "",
//                 level: "notion",
//             }
//             : {
//                 courseId: (id as string) ?? "",
//                 courseTitle: structure?.cours.titre ?? "Cours",
//                 level: "cours",
//             }
//     );





//     // Alimente l'agent IA avec le granule affiché
//     useGranuleContext(
//         structure && currentGranule
//             ? {
//                 courseId: structure.cours.id,
//                 courseTitle: structure.cours.titre,
//                 notionTitle: currentGranule.titre,
//                 notionContent: currentGranule.contenu?.html_content ?? "",
//                 level: "notion",
//             }
//             : {
//                 courseId: (id as string) ?? "",
//                 courseTitle: structure?.cours.titre ?? "Cours",
//                 level: "cours",
//             }
//     );


//     useEffect(() => {
//         const fetchContent = async () => {
//             try {
//                 const data = await api.getCourseContent(id as string)
//                 setStructure(data)

//                 // Sélectionner le premier granulé par défaut
//                 if (data.parties?.[0]?.chapitres?.[0]?.sections?.[0]?.sous_sections?.[0]?.granules?.[0]) {
//                     setSelectedGranuleId(data.parties[0].chapitres[0].sections[0].sous_sections[0].granules[0].id)
//                 }
//             } catch (error) {
//                 console.error("Erreur lors du chargement du contenu:", error)
//                 toast({
//                     variant: "destructive",
//                     title: "Erreur",
//                     description: "Impossible de charger le contenu du cours."
//                 })
//             } finally {
//                 setLoading(false)
//             }
//         }

//         if (id) fetchContent()
//     }, [id])





//     const goToNext = () => {
//         if (currentIndex < flatGranules.length - 1) {
//             const nextId = flatGranules[currentIndex + 1].id
//             setSelectedGranuleId(nextId)
//             setActiveCollection(null)
//             // Le hook useAnalytics détecte automatiquement le changement
//             // et envoie granule_view_end pour le précédent + granule_view_start pour le suivant
//         }
//     }



//     const goToPrev = () => {
//         if (currentIndex > 0) {
//             const prevId = flatGranules[currentIndex - 1].id
//             setSelectedGranuleId(prevId)
//             setActiveCollection(null) // Reset mode collection
//         }
//     }

//     // Tracker progression
//     useEffect(() => {
//         if (id && selectedGranuleId && user?.role === 'etudiant') {
//             api.trackProgression(id as string, selectedGranuleId).catch(console.error)
//         }
//     }, [id, selectedGranuleId, user])

//     const handleExport = async () => {
//         if (!structure) return
//         try {
//             toast({
//                 title: "Export en cours",
//                 description: "Votre document DOCX est en cours de génération..."
//             })
//             await exportCourseToWord(structure)
//             toast({
//                 title: "Succès",
//                 description: "Le cours a été exporté avec succès."
//             })
//         } catch (error) {
//             console.error("Export error:", error)
//             toast({
//                 variant: "destructive",
//                 title: "Erreur",
//                 description: "L'export a échoué."
//             })
//         }
//     }

//     // --- LOGIQUE DE COLLECTION ---
//     const collectGranules = (container: any, type: 'chapitre' | 'section' | 'sous_section' | 'partie') => {
//         const collected: Granule[] = []

//         if (type === 'partie') {
//             container.chapitres.forEach((c: any) =>
//                 c.sections.forEach((s: any) =>
//                     s.sous_sections.forEach((ss: any) => collected.push(...ss.granules))
//                 )
//             )
//         } else if (type === 'chapitre') {
//             container.sections.forEach((s: any) =>
//                 s.sous_sections.forEach((ss: any) => collected.push(...ss.granules))
//             )
//         } else if (type === 'section') {
//             container.sous_sections.forEach((ss: any) => collected.push(...ss.granules))
//         } else if (type === 'sous_section') {
//             collected.push(...container.granules)
//         }
//         return collected
//     }

//     const handleHeaderClick = (container: any, type: 'chapitre' | 'section' | 'sous_section' | 'partie') => {
//         const granules = collectGranules(container, type)
//         if (granules.length > 0) {
//             setActiveCollection({
//                 title: container.titre,
//                 granules: granules
//             })
//             // On ne change pas forcément selectedGranuleId pour garder le fil, ou on met le premier
//             // setSelectedGranuleId(granules[0].id)
//         } else {
//             toast({ title: "Info", description: "Aucun contenu dans cette section." })
//         }
//     }

//     if (loading) {
//         return (
//             <div className="flex h-screen items-center justify-center bg-background">
//                 <div className="flex flex-col items-center gap-4">
//                     <Loader2 className="h-10 w-10 animate-spin text-primary" />
//                     <p className="text-muted-foreground animate-pulse font-medium">Chargement du contenu...</p>
//                 </div>
//             </div>
//         )
//     }

//     if (!structure) return null

//     // DÉCISION D'AFFICHAGE : Collection ou Granule Unique
//     const granulesToDisplay = activeCollection ? activeCollection.granules : (currentGranule ? [currentGranule] : [])
//     const displayTitle = activeCollection ? activeCollection.title : (currentGranule?.titre || "")

//     return (
//         <div className="flex h-screen bg-background overflow-hidden">
//             {/* Sidebar TOC */}
//             <div
//                 className={cn(
//                     "border-r bg-muted/30 flex flex-col transition-all duration-300 ease-in-out",
//                     isSidebarOpen ? "w-80" : "w-0 opacity-0 pointer-events-none"
//                 )}
//             >
//                 <div className="p-4 border-b flex items-center justify-between">
//                     <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
//                         <BookOpen className="h-4 w-4" />
//                         Sommaire
//                     </h2>
//                     <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
//                         <ChevronLeft className="h-4 w-4" />
//                     </Button>
//                 </div>

//                 <ScrollArea className="flex-1">
//                     <div className="p-4 space-y-4">
//                         {structure.parties.map((partie) => (
//                             <div key={partie.id} className="space-y-2">
//                                 <h3
//                                     className="font-bold text-primary flex items-center gap-2 cursor-pointer hover:underline"
//                                     onClick={() => handleHeaderClick(partie, 'partie')}
//                                 >
//                                     <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">P{partie.numero}</span>
//                                     {partie.titre}
//                                 </h3>
//                                 <div className="pl-2 space-y-3 border-l-2 border-muted border-dashed ml-2">
//                                     {partie.chapitres.map((chapitre) => (
//                                         <div key={chapitre.id} className="space-y-1">
//                                             {/* CHAPITRE CLICKABLE */}
//                                             <button
//                                                 onClick={() => handleHeaderClick(chapitre, 'chapitre')}
//                                                 className="w-full text-left font-semibold text-sm text-foreground/80 hover:text-primary transition-colors flex items-center gap-2"
//                                             >
//                                                 Ch.{chapitre.numero} : {chapitre.titre}
//                                             </button>

//                                             <div className="pl-4 space-y-1">
//                                                 {chapitre.sections.map((section) => (
//                                                     <div key={section.id} className="space-y-1">
//                                                         {/* SECTION CLICKABLE */}
//                                                         <button
//                                                             onClick={() => handleHeaderClick(section, 'section')}
//                                                             className="w-full text-left font-medium text-xs text-muted-foreground hover:text-primary transition-colors"
//                                                         >
//                                                             {section.titre}
//                                                         </button>

//                                                         {section.sous_sections.map((ss) => (
//                                                             <div key={ss.id} className="space-y-0.5">
//                                                                 {/* SOUS-SECTION CLICKABLE */}
//                                                                 <button
//                                                                     onClick={() => handleHeaderClick(ss, 'sous_section')}
//                                                                     className="w-full text-left text-[10px] uppercase font-bold text-muted-foreground/70 hover:text-primary mt-2 mb-1"
//                                                                 >
//                                                                     {ss.titre}
//                                                                 </button>

//                                                                 {ss.granules.map((granule) => (
//                                                                     <button
//                                                                         key={granule.id}
//                                                                         onClick={() => {
//                                                                             setSelectedGranuleId(granule.id)
//                                                                             setActiveCollection(null) // Retour mode single si clic précis
//                                                                         }}
//                                                                         className={cn(
//                                                                             "w-full text-left text-xs py-1.5 px-2 rounded-md transition-colors flex items-start gap-2",
//                                                                             (selectedGranuleId === granule.id && !activeCollection)
//                                                                                 ? "bg-primary text-primary-foreground font-medium shadow-sm"
//                                                                                 : "hover:bg-muted text-muted-foreground hover:text-foreground"
//                                                                         )}
//                                                                     >
//                                                                         <div className="mt-0.5">
//                                                                             {granule.type === 'CONTENU' ? <FileText className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
//                                                                         </div>
//                                                                         <span className="flex-1 leading-tight">{granule.titre}</span>
//                                                                         {selectedGranuleId === granule.id && <CheckCircle2 className="h-3 w-3 mt-0.5" />}
//                                                                     </button>
//                                                                 ))}
//                                                             </div>
//                                                         ))}
//                                                     </div>
//                                                 ))}
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </ScrollArea>
//             </div>

//             {/* Main Content Area */}
//             <div className="flex-1 flex flex-col min-w-0 bg-background">
//                 {/* Header */}
//                 <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur sticky top-0 z-10">
//                     <div className="flex items-center gap-4 min-w-0">
//                         {!isSidebarOpen && (
//                             <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
//                                 <Menu className="h-5 w-5" />
//                             </Button>
//                         )}
//                         <h1 className="font-semibold truncate text-foreground flex items-center gap-2">
//                             {activeCollection ? (
//                                 <>
//                                     <span className="opacity-50 font-normal hidden sm:inline">Vue d'ensemble :</span>
//                                     {displayTitle}
//                                 </>
//                             ) : (
//                                 structure.cours.titre
//                             )}
//                         </h1>
//                     </div>

//                     <div className="flex items-center gap-2">
//                         <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={handleExport}
//                             className="hidden sm:flex"
//                         >
//                             <Download className="h-4 w-4 mr-2" />
//                             DOCX
//                         </Button>
//                         <Button variant="ghost" size="sm" onClick={() => router.push(`/cours/${id}`)}>
//                             Quitter
//                         </Button>

//                         {/* Cloche notifications — visible pour tous les connectés */}
//                         <NotificationsBell />

//                         {/* Bouton Discussions */}
//                         <Button
//                             variant={showComments ? "default" : "outline"}
//                             size="sm"
//                             onClick={() => setShowComments(!showComments)}
//                             className={showComments ? "bg-primary text-primary-foreground" : ""}
//                         >
//                             <MessageSquare className="h-4 w-4 mr-1.5" />
//                             <span className="hidden sm:inline">Discussions</span>
//                         </Button>
//                     </div>
//                 </header>

//                 {/* Content Viewport */}
//                 <main className="flex-1 overflow-y-auto">
//                     <div className="max-w-4xl mx-auto px-6 py-12">
//                         {granulesToDisplay.length > 0 ? (
//                             <div className="space-y-12 h-full">
//                                 {activeCollection && (
//                                     <div className="mb-12 border-b pb-6">
//                                         <h1 className="text-4xl font-extrabold text-primary">{activeCollection.title}</h1>
//                                         <p className="text-muted-foreground mt-2">{activeCollection.granules.length} éléments de lecture</p>
//                                     </div>
//                                 )}

//                                 {granulesToDisplay.map((g, index) => (
//                                     <div key={g.id} className={cn("mb-4", !activeCollection && "border-b pb-8")}>
//                                         {/* Titre affiché UNIQUEMENT si ce n'est pas du texte fluide (ex: vidéo, image) OU si mode single */}
//                                         {(!activeCollection || g.type !== 'CONTENU') && (
//                                             <div className="mb-4">
//                                                 <h2 className="text-2xl font-bold text-foreground">{g.titre}</h2>
//                                             </div>
//                                         )}

//                                         <div
//                                             className={cn(
//                                                 "rich-text-content prose prose-slate dark:prose-invert max-w-none",
//                                                 activeCollection ? "text-lg leading-relaxed" : ""
//                                             )}
//                                             dangerouslySetInnerHTML={{ __html: g.contenu.html_content || '' }}
//                                         />
//                                     </div>
//                                 ))}

//                                 {/* Espace vide en bas pour le scroll */}
//                                 <div className="h-32"></div>
//                             </div>
//                         ) : (
//                             <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
//                                 <BookOpen className="h-12 w-12 opacity-20" />
//                                 <p>Sélectionnez un chapitre ou une section pour lire.</p>
//                             </div>
//                         )}
//                     </div>
//                 </main>

//                 {/* Footer de navigation (Masqué en mode collection pour éviter la confusion ou adapté) */}
//                 {!activeCollection && (
//                     <footer className="h-16 border-t bg-background/95 backdrop-blur flex items-center justify-between px-6 sticky bottom-0">
//                         <Button
//                             variant="ghost"
//                             onClick={goToPrev}
//                             disabled={currentIndex <= 0}
//                             className="gap-2"
//                         >
//                             <ChevronLeft className="h-4 w-4" />
//                             <span className="hidden sm:inline">Précédent</span>
//                         </Button>

//                         <div className="flex items-center gap-2">
//                             <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden hidden md:block">
//                                 <div
//                                     className="h-full bg-primary transition-all duration-500"
//                                     style={{ width: `${((currentIndex + 1) / flatGranules.length) * 100}%` }}
//                                 />
//                             </div>
//                             <span className="text-xs text-muted-foreground font-medium">
//                                 {currentIndex + 1} / {flatGranules.length}
//                             </span>
//                         </div>

//                         <Button
//                             variant={currentIndex < flatGranules.length - 1 ? "default" : "outline"}
//                             onClick={goToNext}
//                             disabled={currentIndex >= flatGranules.length - 1}
//                             className="gap-2"
//                         >
//                             <span className="hidden sm:inline">Suivant</span>
//                             <ChevronRight className="h-4 w-4" />
//                         </Button>
//                     </footer>
//                 )}

//                 {/* Panneau Discussions latéral — conditionnel */}
//                 {showComments && currentGranule && (
//                     <div className="w-80 xl:w-96 border-l border-border flex flex-col bg-background flex-shrink-0">
//                         {/* Header panneau */}
//                         <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
//                             <span className="text-sm font-semibold text-foreground">
//                                 Discussions
//                             </span>
//                             <button
//                                 onClick={() => setShowComments(false)}
//                                 className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
//                             >
//                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
//                                     <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
//                                 </svg>
//                             </button>
//                         </div>
//                         {/* CommentsPanel */}
//                         <div className="flex-1 overflow-y-auto p-4">
//                             <CommentsPanel
//                                 granuleId={currentGranule.id}
//                                 courseId={id as string}
//                                 compact={true}
//                             />
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     )
// }
