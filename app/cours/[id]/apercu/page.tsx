"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { api, Course } from "@/lib/api"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Loader2,
    BookOpen,
    ArrowLeft,
    Download,
    Printer,
    Sparkles,
    FileText,
    AlignLeft,
    Share2,
    CheckCircle2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { exportCourseToWord } from "@/lib/docx-export"

interface Granule {
    id: string
    titre: string
    type: string
    ordre: number
    contenu: { html_content?: string; [key: string]: any }
}
interface SousSection {
    id: string
    titre: string
    numero: number
    granules: Granule[]
}
interface Section {
    id: string
    titre: string
    numero: number
    sous_sections: SousSection[]
}
interface Chapitre {
    id: string
    titre: string
    numero: number
    sections: Section[]
}
interface Partie {
    id: string
    titre: string
    numero: number
    chapitres: Chapitre[]
}
interface CourseStructure {
    cours: { id: string; titre: string; description: string; enseignant: string }
    parties: Partie[]
}

function isUuidLike(value?: string | null) {
    if (!value) return false
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function toCourseStructure(data: any): CourseStructure | null {
    if (!data) return null

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

export default function IntegralPreviewPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const courseId = params.id as string

    const [course, setCourse] = useState<Course | null>(null)
    const [structure, setStructure] = useState<CourseStructure | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!courseId) return

        const fetchData = async () => {
            try {
                const [courseData, contentData] = await Promise.all([
                    api.getCourse(courseId),
                    api.getCourseContent(courseId)
                ])
                setCourse(courseData)
                setStructure(toCourseStructure(contentData))
            } catch (err) {
                console.error("Erreur de chargement de l'aperçu intégral:", err)
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Impossible de charger l'aperçu intégral du document"
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [courseId, toast])

    const flatChaptersAndGranules = useMemo(() => {
        if (!structure) return []
        const elements: Array<{ type: "partie" | "chapitre" | "section" | "granule"; title: string; html?: string; id: string }> = []
        
        structure.parties.forEach((partie, pi) => {
            elements.push({
                type: "partie",
                title: `${pi + 1}. ${partie.titre}`,
                id: partie.id
            })

            partie.chapitres.forEach((ch) => {
                elements.push({
                    type: "chapitre",
                    title: `Chapitre ${ch.numero} : ${ch.titre}`,
                    id: ch.id
                })

                ch.sections.forEach((sec) => {
                    elements.push({
                        type: "section",
                        title: sec.titre,
                        id: sec.id
                    })

                    sec.sous_sections.forEach((ss) => {
                        ss.granules.forEach((g) => {
                            elements.push({
                                type: "granule",
                                title: g.titre,
                                html: g.contenu?.html_content || g.contenu?.html || g.contenu?.content || "",
                                id: g.id
                            })
                        })
                    })
                })
            })
        })

        return elements
    }, [structure])

    const readingTime = useMemo(() => {
        if (flatChaptersAndGranules.length === 0) return 0
        const totalText = flatChaptersAndGranules
            .filter(e => e.type === "granule" && e.html)
            .map(e => e.html!.replace(/<[^>]*>/g, " "))
            .join(" ")
        const wordCount = totalText.split(/\s+/).length
        return Math.max(1, Math.round(wordCount / 200)) // 200 mots par minute en moyenne
    }, [flatChaptersAndGranules])

    const handlePrint = () => {
        window.print()
    }

    const handleExportWord = async () => {
        if (!structure) return
        try {
            await exportCourseToWord(structure)
            toast({
                title: "Succès",
                description: "Le document Word a été généré avec succès !"
            })
        } catch (err) {
            console.error(err)
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Échec de la génération du document Word"
            })
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen flex-col">
                <SiteHeader />
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm font-medium">Assembling premium document view...</p>
                </div>
            </div>
        )
    }

    if (!course || !structure) {
        return (
            <div className="flex h-screen flex-col">
                <SiteHeader />
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Contenu indisponible</h2>
                    <p className="text-muted-foreground mb-6">Le document n'a pas pu être chargé.</p>
                    <Button onClick={() => router.push(`/cours/${courseId}`)}>
                        Retour au cours
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Barre de navigation standard visible à l'écran (masquée à l'impression) */}
            <div className="print:hidden">
                <SiteHeader />
            </div>

            {/* En-tête de contrôle premium */}
            <div className="bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-b sticky top-[64px] z-20 backdrop-blur-md bg-background/80 print:hidden">
                <div className="container py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => router.push(`/cours/${courseId}`)}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Button>
                        <div className="h-4 w-px bg-border shrink-0"></div>
                        <div className="min-w-0">
                            <h2 className="font-semibold text-foreground truncate text-sm sm:text-base">{course.titre}</h2>
                            <p className="text-xs text-muted-foreground truncate">{readingTime} min de lecture estimée • {flatChaptersAndGranules.filter(e => e.type === "granule").length} granules</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-border/80">
                            <Printer className="h-4 w-4" />
                            Imprimer / PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportWord} className="gap-2 border-border/80">
                            <Download className="h-4 w-4" />
                            Exporter Word
                        </Button>
                        <Button size="sm" onClick={() => router.push(`/cours/${courseId}/lecture`)} className="gap-2 bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm">
                            <BookOpen className="h-4 w-4" />
                            Ouvrir le cours
                        </Button>
                    </div>
                </div>
            </div>

            {/* Zone de lecture / Aperçu intégral */}
            <main className="container flex-1 py-8 md:py-16 px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
                    
                    {/* Sommaire rapide à gauche (masqué à l'impression) */}
                    <aside className="print:hidden hidden lg:block sticky top-[140px] h-[calc(100vh-180px)] overflow-y-auto pr-4">
                        <div className="space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <AlignLeft className="h-4 w-4 text-primary" />
                                Sommaire
                            </h3>
                            <nav className="space-y-1">
                                {flatChaptersAndGranules.filter(e => e.type === "partie" || e.type === "chapitre").map((el) => (
                                    <a
                                        key={el.id}
                                        href={`#${el.id}`}
                                        className={`block py-1.5 text-xs transition-colors truncate ${
                                            el.type === "partie"
                                                ? "font-bold text-foreground/90 border-l-2 border-primary/30 pl-2.5 hover:text-primary hover:border-primary"
                                                : "text-muted-foreground pl-5 hover:text-foreground border-l border-border/60"
                                        }`}
                                    >
                                        {el.title}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Contenu assemblé intégral */}
                    <article className="max-w-4xl mx-auto w-full prose prose-slate dark:prose-invert">
                        {/* Titre d'entête premium */}
                        <div className="mb-12 border-b pb-8 print:border-none print:pb-0 print:mb-6">
                            <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/5 uppercase tracking-widest text-[10px] py-1 font-bold print:hidden">
                                Aperçu Intégral du Document
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-none mb-4">
                                {course.titre}
                            </h1>
                            <p className="text-muted-foreground text-lg italic mt-2 print:not-italic print:text-black">
                                {course.description || "Généré intégralement depuis vos ressources."}
                            </p>
                        </div>

                        {/* Rendu continu de toutes les granules du document assemblées */}
                        <div className="space-y-12 print:space-y-6">
                            {flatChaptersAndGranules.map((el) => {
                                if (el.type === "partie") {
                                    return (
                                        <div key={el.id} id={el.id} className="pt-8 border-t border-border/80 first:border-none print:pt-4 print:border-none page-break-before">
                                            <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight uppercase mb-6 print:text-black">
                                                {el.title}
                                            </h2>
                                        </div>
                                    )
                                }

                                if (el.type === "chapitre") {
                                    return (
                                        <div key={el.id} id={el.id} className="pt-6 print:pt-3">
                                            <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-4 print:text-black">
                                                {el.title}
                                            </h3>
                                        </div>
                                    )
                                }

                                if (el.type === "section") {
                                    return (
                                        <div key={el.id} id={el.id} className="pt-4 print:pt-2">
                                            <h4 className="text-lg font-bold text-foreground/80 mb-3 print:text-black">
                                                {el.title}
                                            </h4>
                                        </div>
                                    )
                                }

                                // Granule rendering
                                return (
                                    <div key={el.id} className="pl-4 border-l-2 border-muted/50 py-2 hover:border-primary/50 transition-all duration-300 print:pl-0 print:border-none">
                                        <div className="flex items-center gap-2 mb-3 print:hidden">
                                            <span className="text-[10px] font-bold text-primary tracking-widest uppercase flex items-center gap-1.5">
                                                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                                                Granule
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">•</span>
                                            <span className="text-[10px] text-muted-foreground font-medium">{el.title}</span>
                                        </div>
                                        <div
                                            className="text-muted-foreground dark:text-foreground/90 text-base md:text-lg leading-relaxed space-y-4 print:text-black print:text-base"
                                            dangerouslySetInnerHTML={{ __html: el.html || '<p class="italic text-muted-foreground/30">Contenu vide.</p>' }}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </article>

                </div>
            </main>

            {/* Pied de page visible à l'écran (masqué à l'impression) */}
            <div className="print:hidden">
                <SiteFooter />
            </div>

            {/* Styles CSS d'impression exclusifs pour un rendu parfait */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .page-break-before {
                        page-break-before: always;
                    }
                    article {
                        max-width: 100% !important;
                        width: 100% !important;
                    }
                }
            `}</style>
        </div>
    )
}
