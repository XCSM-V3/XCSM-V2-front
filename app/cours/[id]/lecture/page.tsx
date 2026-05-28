"use client"

import CommentsPanel from "@/components/comments/CommentsPanel"
import NotificationsBell from "@/components/comments/NotificationsBell"
import { useGranuleContext } from "@/hooks/useGranuleContext"
import { useAnalytics } from "@/hooks/useAnalytics"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/hooks/use-api"
import { ChevronLeft, ChevronRight, BookOpen, Download, FileText, CheckCircle2, PlayCircle, Loader2, MessageSquare, X, GraduationCap, ArrowLeft, List, Search } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { exportCourseToWord } from "@/lib/docx-export"

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
        // Normalisation legacy :
        // - Certains cours peuvent contenir des IDs de granules dupliqués (ou non-UUID) côté structure,
        //   ce qui rend plusieurs items "actifs" (verts) en même temps et empêche la navigation.
        // - On force donc des IDs de navigation uniques par position, tout en conservant le vrai UUID backend
        //   dans `_realId` pour les commentaires/progression.
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
                    // Always generate a unique synthetic ID based on position to avoid duplicates
                    const gId = `${data.id}-p${pi + 1}-c${ci + 1}-s${si + 1}`
                    const granule: Granule = {
                        id: gId,
                        titre: String(p.title ?? `Section ${si + 1}`),
                        type: "CONTENU",
                        ordre: si + 1,
                        contenu: { html_content: String(p.content ?? "") },
                        // Keep the real granule_id for API calls that need it
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

export default function CourseViewerPage() {
    const { id } = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const granuleParam = searchParams ? searchParams.get("granule") : null
    const { user } = useAuth()
    const [structure, setStructure] = useState<CourseStructure | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedGranuleId, setSelectedGranuleId] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [activeCollection, setActiveCollection] = useState<{ title: string; granules: Granule[] } | null>(null)
    const [showComments, setShowComments] = useState(false)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [scrollPct, setScrollPct] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const mainRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const flatGranules = useMemo(() => {
        if (!structure) return []
        const g: Granule[] = []
        ;(structure.parties || []).forEach(p =>
            (p.chapitres || []).forEach(c =>
                (c.sections || []).forEach(s =>
                    (s.sous_sections || []).forEach(ss => g.push(...(ss.granules || [])))
                )
            )
        )
        return g
    }, [structure])

    const currentIndex = flatGranules.findIndex(g => g.id === selectedGranuleId)
    const currentGranule = flatGranules[currentIndex]
    const progress = flatGranules.length > 0 ? ((currentIndex + 1) / flatGranules.length) * 100 : 0

    // ── Search helpers ──
    function stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim()
    }

    function escapeRegExp(s: string): string {
        return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    }

    function getSnippet(html: string, query: string, windowSize = 80): string {
        const text = stripHtml(html)
        const idx = text.toLowerCase().indexOf(query.toLowerCase())
        if (idx === -1) return ""
        const start = Math.max(0, idx - windowSize)
        const end = Math.min(text.length, idx + query.length + windowSize)
        return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "")
    }

    function getGranulePath(granuleId: string): { partie: string; chapitre: string } | null {
        if (!structure) return null
        for (const p of structure.parties) {
            for (const c of p.chapitres) {
                for (const s of c.sections) {
                    for (const ss of s.sous_sections) {
                        for (const g of ss.granules) {
                            if (g.id === granuleId) return { partie: p.titre, chapitre: c.titre }
                        }
                    }
                }
            }
        }
        return null
    }

    const expandParentsForGranule = useCallback((granuleId: string) => {
        if (!structure) return
        for (const p of structure.parties) {
            for (const c of p.chapitres) {
                for (const s of c.sections) {
                    for (const ss of s.sous_sections) {
                        for (const g of ss.granules) {
                            if (g.id === granuleId) {
                                setExpanded(prev => {
                                    const next = new Set(prev)
                                    next.add(p.id)
                                    next.add(c.id)
                                    return next
                                })
                                return
                            }
                        }
                    }
                }
            }
        }
    }, [structure])

    const searchResults = useMemo(() => {
        const q = searchQuery.trim()
        if (q.length < 2 || flatGranules.length === 0) return []
        const lower = q.toLowerCase()
        return flatGranules
            .map(g => {
                const titleMatch = g.titre.toLowerCase().includes(lower)
                const bodyText = stripHtml(g.contenu?.html_content ?? "")
                const bodyMatch = bodyText.toLowerCase().includes(lower)
                if (!titleMatch && !bodyMatch) return null
                return {
                    granule: g,
                    titleMatch,
                    bodyMatch,
                    snippet: bodyMatch ? getSnippet(g.contenu?.html_content ?? "", q) : "",
                    path: getGranulePath(g.id),
                }
            })
            .filter(Boolean) as { granule: Granule; titleMatch: boolean; bodyMatch: boolean; snippet: string; path: { partie: string; chapitre: string } | null }[]
    }, [searchQuery, flatGranules, structure])

    function highlightText(text: string, highlight: string) {
        if (!highlight.trim()) return text
        const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, "gi"))
        return parts.map((part, i) =>
            part.toLowerCase() === highlight.toLowerCase()
                ? `<mark class="bg-yellow-300/60 dark:bg-yellow-500/30 text-foreground rounded-sm px-0.5">${part}</mark>`
                : part
        ).join("")
    }

    // Le vrai UUID backend (pour les commentaires et la progression). Les IDs de navigation
    // sont toujours synthétiques (uniques par position) pour éviter les doublons dans la sidebar.
    const realGranuleId: string | null = (currentGranule as any)?._realId ?? null

    useAnalytics({ course_id: id as string, granule_id: realGranuleId ?? currentGranule?.id, granule_title: currentGranule?.titre })
    useGranuleContext(structure && currentGranule
        ? { courseId: structure.cours.id, courseTitle: structure.cours.titre, notionTitle: currentGranule.titre, notionContent: currentGranule.contenu?.html_content ?? "", level: "notion" }
        : { courseId: (id as string) ?? "", courseTitle: structure?.cours.titre ?? "Cours", level: "cours" }
    )

    useEffect(() => {
        const el = mainRef.current; if (!el) return
        const h = () => setScrollPct(el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight) * 100)
        el.addEventListener('scroll', h); return () => el.removeEventListener('scroll', h)
    }, [currentGranule])

    // Ctrl+K to focus search
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setSidebarOpen(true)
                searchInputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    useEffect(() => {
        if (!id) return
        api.getCourseContent(id as string).then(data => {
            const normalized = toCourseStructure(data)
            if (!normalized) {
                throw new Error("Format de contenu de cours inattendu")
            }
            setStructure(normalized)
            
            const ids = new Set<string>()
            let foundGranule = null
            
            if (granuleParam) {
                for (const p of normalized.parties || []) {
                    for (const c of p.chapitres || []) {
                        for (const s of c.sections || []) {
                            for (const ss of s.sous_sections || []) {
                                for (const g of ss.granules || []) {
                                    // Cherche par ID de navigation OU par vrai UUID backend (_realId)
                                    const matchesNav = g.id === granuleParam
                                    const matchesReal = (g as any)._realId === granuleParam
                                    if (matchesNav || matchesReal) {
                                        foundGranule = g
                                        ids.add(p.id)
                                        ids.add(c.id)
                                        ids.add(s.id)
                                        break
                                    }
                                }
                                if (foundGranule) break
                            }
                            if (foundGranule) break
                        }
                        if (foundGranule) break
                    }
                    if (foundGranule) break
                }
            }
            
            if (foundGranule) {
                setSelectedGranuleId(foundGranule.id)
            } else {
                const first = normalized.parties?.[0]?.chapitres?.[0]?.sections?.[0]?.sous_sections?.[0]?.granules?.[0]
                if (first) setSelectedGranuleId(first.id)
                if (normalized.parties?.[0]) ids.add(normalized.parties[0].id)
                if (normalized.parties?.[0]?.chapitres?.[0]) ids.add(normalized.parties[0].chapitres[0].id)
            }
            setExpanded(ids)
        }).catch((err) => {
            const msg = err instanceof Error ? err.message : "Erreur de chargement"
            toast({ variant: "destructive", title: "Erreur de chargement", description: msg })
        })
          .finally(() => setLoading(false))
    }, [id, granuleParam])

    useEffect(() => {
        // Utilise le vrai UUID (_realId) pour la progression si disponible.
        // Les IDs de navigation sont synthétiques et non acceptés par le backend.
        const trackId = realGranuleId
        if (id && trackId && user?.role === 'etudiant' && isUuidLike(trackId)) {
            api.trackProgression(id as string, trackId).catch(console.error)
        }
        mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        setScrollPct(0)
    }, [selectedGranuleId])

    const goNext = () => { if (currentIndex < flatGranules.length - 1) { setSelectedGranuleId(flatGranules[currentIndex + 1].id); setActiveCollection(null) } }
    const goPrev = () => { if (currentIndex > 0) { setSelectedGranuleId(flatGranules[currentIndex - 1].id); setActiveCollection(null) } }
    const toggle = (i: string) => setExpanded(p => { const s = new Set(p); s.has(i) ? s.delete(i) : s.add(i); return s })

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-5">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-primary">
                        <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -inset-2 rounded-2xl animate-ping opacity-20 bg-primary" />
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Chargement du cours...</p>
            </div>
        </div>
    )
    if (!structure) return null

    const granulesToDisplay = activeCollection ? activeCollection.granules : (currentGranule ? [currentGranule] : [])

    return (
        <div className="h-screen flex overflow-hidden bg-background">

            {/* Top reading progress line */}
            <div className="fixed top-0 left-0 h-[3px] bg-primary z-50 transition-all duration-200" style={{ width: `${scrollPct}%` }} />

            {/* ── SIDEBAR ── */}
            <aside
                className={cn(
                    "flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out bg-muted/30 border-r border-border",
                    sidebarOpen ? "w-[280px]" : "w-0 opacity-0 overflow-hidden"
                )}
            >
                {/* Header */}
                <div className="flex-shrink-0 px-5 py-4 border-b border-border">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm bg-primary/10 text-primary">
                                <BookOpen className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-foreground font-semibold text-xs leading-snug truncate">{structure.cours.titre}</p>
                                <p className="text-muted-foreground text-xs truncate mt-0.5">{structure.cours.enseignant}</p>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Progress inside sidebar */}
                    <div className="mt-5 bg-card p-3 rounded-xl border border-border shadow-sm">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-muted-foreground font-medium">Progression</span>
                            <span className="font-bold text-primary">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-muted-foreground text-[10px] mt-2 font-medium uppercase tracking-wider">{currentIndex + 1} / {flatGranules.length} granules</p>
                    </div>
                </div>

                {/* Search Input */}
                <div className="flex-shrink-0 px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Rechercher dans le cours…"
                            className="w-full pl-9 pr-8 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(""); searchInputRef.current?.focus() }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Results OR TOC */}
                <ScrollArea className="flex-1">
                    {searchQuery.trim().length >= 2 ? (
                        /* ── Search Results ── */
                        <div className="px-3 py-2 space-y-1">
                            {searchResults.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-xs font-medium text-muted-foreground">Aucun résultat pour</p>
                                    <p className="text-xs text-foreground font-semibold mt-1">"{searchQuery}"</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                                        {searchResults.length} résultat{searchResults.length > 1 ? "s" : ""}
                                    </p>
                                    {searchResults.map(result => (
                                        <button
                                            key={result.granule.id}
                                            onClick={() => {
                                                setSelectedGranuleId(result.granule.id)
                                                setActiveCollection(null)
                                                expandParentsForGranule(result.granule.id)
                                                setSearchQuery("")
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-3 rounded-xl transition-all group border border-transparent",
                                                selectedGranuleId === result.granule.id
                                                    ? "bg-primary/10 border-primary/20"
                                                    : "hover:bg-muted/60 hover:border-border"
                                            )}
                                        >
                                            {/* Breadcrumb path */}
                                            {result.path && (
                                                <p className="text-[10px] text-muted-foreground truncate mb-1 flex items-center gap-1">
                                                    <span className="truncate">{result.path.partie}</span>
                                                    <ChevronRight className="h-2.5 w-2.5 flex-shrink-0" />
                                                    <span className="truncate">{result.path.chapitre}</span>
                                                </p>
                                            )}
                                            {/* Title */}
                                            <p
                                                className="text-xs font-semibold text-foreground leading-snug truncate"
                                                dangerouslySetInnerHTML={{ __html: highlightText(result.granule.titre, searchQuery.trim()) }}
                                            />
                                            {/* Snippet */}
                                            {result.snippet && (
                                                <p
                                                    className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed line-clamp-2"
                                                    dangerouslySetInnerHTML={{ __html: highlightText(result.snippet, searchQuery.trim()) }}
                                                />
                                            )}
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    ) : (
                        /* ── TOC (Table of Contents) ── */
                        <div className="py-3 px-3 space-y-1">
                            {structure.parties.map((partie, pi) => (
                                <div key={partie.id} className="mb-1">
                                    <button onClick={() => toggle(partie.id)} className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 hover:bg-muted/60 transition-colors group">
                                        <span className="text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">{pi + 1}</span>
                                        <span className="flex-1 text-foreground text-xs font-semibold uppercase tracking-wider truncate">{partie.titre}</span>
                                        <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", expanded.has(partie.id) && "rotate-90")} />
                                    </button>

                                    {expanded.has(partie.id) && partie.chapitres.map(ch => (
                                        <div key={ch.id} className="ml-3 mt-1 relative before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-px before:bg-border">
                                            <button onClick={() => toggle(ch.id)} className="w-full text-left pl-6 pr-3 py-2 rounded-lg flex items-center gap-2 hover:bg-muted/50 transition-colors group">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase flex-shrink-0 group-hover:text-primary transition-colors">Ch.{ch.numero}</span>
                                                <span className="flex-1 text-foreground text-xs font-medium truncate">{ch.titre}</span>
                                                <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform duration-200", expanded.has(ch.id) && "rotate-90")} />
                                            </button>

                                            {expanded.has(ch.id) && (
                                                <div className="ml-6 space-y-0.5 pb-2 pt-1">
                                                    {ch.sections.flatMap(s => s.sous_sections.flatMap(ss => ss.granules.map(g => {
                                                        const active = selectedGranuleId === g.id
                                                        return (
                                                            <button
                                                                key={`${ch.id}-${g.id}`}
                                                                onClick={() => { setSelectedGranuleId(g.id); setActiveCollection(null) }}
                                                                className={cn(
                                                                    "w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-all group",
                                                                    active 
                                                                        ? "bg-primary/10 text-primary font-semibold" 
                                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                                )}
                                                            >
                                                                {active
                                                                    ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                                                                    : g.type === 'CONTENU' ? <FileText className="h-3.5 w-3.5 flex-shrink-0 opacity-70 group-hover:opacity-100" /> : <PlayCircle className="h-3.5 w-3.5 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                                                                }
                                                                <span className="truncate flex-1 leading-tight">{g.titre}</span>
                                                            </button>
                                                        )
                                                    })))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </aside>

            {/* ── MAIN ── */}
            <div className="flex-1 flex flex-col min-w-0 relative">

                {/* Top bar (Glassmorphism) */}
                <header className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-5 gap-4 flex-shrink-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
                    <div className="flex items-center gap-2 min-w-0">
                        <button onClick={() => router.push(`/cours/${id}`)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0" title="Retour au cours">
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        {!sidebarOpen && (
                            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0" title="Ouvrir le sommaire">
                                <List className="h-4 w-4" />
                            </button>
                        )}
                        <div className="min-w-0 ml-2 hidden sm:block">
                            <p className="text-foreground font-semibold text-sm truncate">{structure.cours.titre}</p>
                            {currentGranule && !activeCollection && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="truncate">{currentGranule.titre}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button onClick={async () => { if (!structure) return; try { await exportCourseToWord(structure); toast({ title: "Export réussi" }) } catch { toast({ variant: "destructive", title: "Erreur" }) } }}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Exporter en DOCX">
                            <Download className="h-4 w-4" />
                        </button>
                        <NotificationsBell />
                        <button onClick={() => setShowComments(v => !v)}
                            className={cn(
                                "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border",
                                showComments
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                            )}>
                            <MessageSquare className="h-4 w-4" />
                            <span className="hidden sm:inline">Discussions</span>
                        </button>
                    </div>
                </header>

                {/* Reading area */}
                <ScrollArea ref={mainRef} className="flex-1 bg-background pt-14">
                    {granulesToDisplay.length > 0 ? (
                        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">

                            {/* Granule header */}
                            {!activeCollection && currentGranule && (
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                            {currentIndex + 1} / {flatGranules.length}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight tracking-tight mb-6">
                                        {currentGranule.titre}
                                    </h1>
                                    <div className="h-1 w-12 bg-primary rounded-full mb-10" />
                                </div>
                            )}

                            {activeCollection && (
                                <div className="mb-10">
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Vue d'ensemble</span>
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">{activeCollection.title}</h1>
                                    <div className="h-px bg-border my-6" />
                                </div>
                            )}

                            {/* Content (Prose Tailwind) */}
                            {granulesToDisplay.map((g, i) => (
                                <div key={g.id}>
                                    {activeCollection && i > 0 && <div className="h-px bg-border my-10" />}
                                    {activeCollection && <h2 className="text-2xl font-bold text-foreground mb-6">{g.titre}</h2>}
                                    <div
                                        className="prose prose-slate dark:prose-invert max-w-none text-base md:text-lg leading-relaxed text-muted-foreground"
                                        dangerouslySetInnerHTML={{ __html: g.contenu?.html_content || '<p class="italic text-muted-foreground/50">Contenu non disponible.</p>' }}
                                    />
                                </div>
                            ))}
                            
                            {/* Espace pour ne pas coller la bottom bar */}
                            <div className="h-24"></div>
                        </div>
                    ) : (
                        <div className="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center gap-5 text-center px-4">
                            <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-muted border border-border shadow-inner">
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-foreground font-semibold text-lg">Sélectionnez un contenu</p>
                                <p className="text-muted-foreground text-sm mt-1">Choisissez un chapitre dans le sommaire à gauche pour commencer la lecture.</p>
                            </div>
                        </div>
                    )}
                </ScrollArea>

                {/* Floating Bottom nav */}
                {!activeCollection && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/90 backdrop-blur-md border border-border shadow-lg rounded-full px-2 py-2 z-10 transition-all">
                        <button onClick={goPrev} disabled={currentIndex <= 0}
                            className="flex items-center justify-center h-10 w-10 sm:w-auto sm:px-4 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted text-foreground"
                            title="Précédent"
                        >
                            <ChevronLeft className="h-5 w-5 sm:mr-1" />
                            <span className="hidden sm:inline">Précédent</span>
                        </button>

                        <div className="px-4 hidden sm:flex items-center">
                            <span className="text-xs font-medium text-muted-foreground">{currentIndex + 1} / {flatGranules.length}</span>
                        </div>

                        <button onClick={goNext} disabled={currentIndex >= flatGranules.length - 1}
                            className="flex items-center justify-center h-10 w-10 sm:w-auto sm:px-5 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                            title="Suivant"
                        >
                            <span className="hidden sm:inline">Suivant</span>
                            <ChevronRight className="h-5 w-5 sm:ml-1" />
                        </button>
                    </div>
                )}
            </div>

            {/* Comments panel */}
            {showComments && currentGranule && (
                <div className="flex-shrink-0 flex flex-col w-[320px] lg:w-[380px] border-l border-border bg-muted/20">
                    <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-border bg-card">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-primary/10 rounded-md">
                                <MessageSquare className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-semibold text-foreground">Discussions</span>
                        </div>
                        <button onClick={() => setShowComments(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        {/* On passe le vrai UUID backend (_realId) pour que les commentaires
                            de l'enseignant et des étudiants se retrouvent sur le même granule. */}
                        <CommentsPanel
                            granuleId={realGranuleId ?? currentGranule.id}
                            courseId={id as string}
                            compact={true}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
