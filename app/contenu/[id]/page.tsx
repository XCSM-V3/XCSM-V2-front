"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    ArrowLeft,
    BookOpen,
    FileText,
    ChevronRight,
    Loader2,
    AlertCircle,
    List,
    Edit,
} from "lucide-react"
import { api } from "@/lib/api"
import { BulkEditModal } from "@/components/edit/BulkEditModal"

interface GranuleContent {
    id: string
    titre: string
    type_contenu: string
    ordre: number
    contenu?: {
        content: string
        html: string
        metadata?: {
            page?: number
        }
    }
    hierarchie?: {
        partie: string
        chapitre: string
        section: string
        sous_section: string
        nouvelle_partie: boolean
        nouveau_chapitre: boolean
        nouvelle_section: boolean
        nouvelle_sous_section: boolean
    }
}

interface ContentData {
    type: "cours" | "partie" | "chapitre" | "section" | "sous_section"
    titre: string
    cours_id: string
    cours_titre: string
    granules: GranuleContent[]
    chemin?: {
        partie?: string
        chapitre?: string
        section?: string
        sous_section?: string
    }
}

export default function ContentViewPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()

    const id = params.id as string
    const type = searchParams.get("type") as ContentData["type"] || "cours"

    const [content, setContent] = useState<ContentData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isOwner, setIsOwner] = useState(false)

    const checkOwnership = () => {
        try {
            const userRole = localStorage.getItem("userRole")
            if (userRole === "enseignant") {
                setIsOwner(true)
            }
        } catch (err) {
            console.error("Erreur vérification propriétaire:", err)
        }
    }

    useEffect(() => {
        const loadContent = async () => {
            setLoading(true)
            setError(null)

            try {
                // Appel à l'API selon le type
                const endpoint = `/contenu/${type}/${id}/`
                const response = await api.get<ContentData>(endpoint)
                setContent(response.data)  // Extraire data de la réponse
            } catch (err: any) {
                console.error("Erreur chargement contenu:", err)
                setError(err.message || "Impossible de charger le contenu")
            } finally {
                setLoading(false)
            }
        }

        loadContent()
        checkOwnership()
    }, [id, type])

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                </div>
            </div>
        )
    }

    if (error || !content) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error || "Contenu introuvable"}</AlertDescription>
                </Alert>
                <Button onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
            </div>
        )
    }

    const getTypeLabel = () => {
        const labels = {
            cours: "Cours",
            partie: "Partie",
            chapitre: "Chapitre",
            section: "Section",
            sous_section: "Sous-section"
        }
        return labels[content.type]
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            {/* Bouton retour */}
            <Button
                variant="ghost"
                onClick={() => router.push(`/cours/${content.cours_id}?tab=content`)}
                className="mb-4"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au cours
            </Button>

            {/* En-tête */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 mb-3">
                                <List className="mr-1 h-3 w-3" />
                                {getTypeLabel()}
                            </Badge>
                            <CardTitle className="text-3xl mb-2">{content.titre}</CardTitle>

                            {/* Fil d'Ariane */}
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-3">
                                <BookOpen className="h-4 w-4" />
                                <span className="font-medium">{content.cours_titre}</span>
                                {content.chemin?.partie && (
                                    <>
                                        <ChevronRight className="h-3 w-3" />
                                        <span>{content.chemin.partie}</span>
                                    </>
                                )}
                                {content.chemin?.chapitre && (
                                    <>
                                        <ChevronRight className="h-3 w-3" />
                                        <span>{content.chemin.chapitre}</span>
                                    </>
                                )}
                                {content.chemin?.section && (
                                    <>
                                        <ChevronRight className="h-3 w-3" />
                                        <span>{content.chemin.section}</span>
                                    </>
                                )}
                                {content.chemin?.sous_section && (
                                    <>
                                        <ChevronRight className="h-3 w-3" />
                                        <span className="text-green-600 font-medium">
                                            {content.chemin.sous_section}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Statistiques */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div>
                                <div className="text-3xl font-bold text-green-600">
                                    {content.granules.length}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Granules
                                </div>
                            </div>
                            <Separator orientation="vertical" className="h-12" />
                            <div>
                                <div className="text-3xl font-bold text-blue-600">
                                    {content.granules.filter(g => g.type_contenu === "TEXTE").length}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Textes
                                </div>
                            </div>
                        </div>

                        {/* Bouton Éditer */}
                        {isOwner && content.granules.length > 0 && (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Éditer tout le {getTypeLabel().toLowerCase()}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Contenu des granules */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Contenu
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {content.granules.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                Aucun contenu disponible
                            </p>
                        </div>
                    ) : (
                        <div className="prose prose-lg max-w-none">
                            {/* Affichage en mode lecture continue */}
                            <div className="bg-white rounded-lg p-8 border border-gray-200 leading-relaxed text-justify">
                                {content.granules.map((granule, index) => (
                                    <div key={granule.id}>
                                        {/* Afficher le titre de la partie si nouveau */}
                                        {granule.hierarchie?.nouvelle_partie && (
                                            <div className="mb-8 mt-12 first:mt-0">
                                                <h1 className="text-4xl font-bold text-primary border-b-4 border-primary pb-3 mb-6">
                                                    {granule.hierarchie.partie}
                                                </h1>
                                            </div>
                                        )}

                                        {/* Afficher le titre du chapitre si nouveau */}
                                        {granule.hierarchie?.nouveau_chapitre && (
                                            <div className="mb-6 mt-10">
                                                <h2 className="text-3xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-4">
                                                    {granule.hierarchie.chapitre}
                                                </h2>
                                            </div>
                                        )}

                                        {/* Afficher le titre de la section si nouveau */}
                                        {granule.hierarchie?.nouvelle_section && (
                                            <div className="mb-4 mt-8">
                                                <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                                                    {granule.hierarchie.section}
                                                </h3>
                                            </div>
                                        )}

                                        {/* Afficher le titre de la sous-section si nouveau */}
                                        {granule.hierarchie?.nouvelle_sous_section && (
                                            <div className="mb-3 mt-6">
                                                <h4 className="text-xl font-medium text-gray-600 mb-2">
                                                    {granule.hierarchie.sous_section}
                                                </h4>
                                            </div>
                                        )}

                                        {/* Contenu du granule */}
                                        {granule.contenu?.content && (
                                            <div className={granule.type_contenu === 'TEXTE' ? "mb-4 last:mb-0" : "mb-8 last:mb-0"}>
                                                <p className="text-gray-900 whitespace-pre-line leading-relaxed text-lg">
                                                    {granule.contenu.content}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bouton retour en bas */}
            <div className="mt-6 flex justify-center">
                <Button
                    onClick={() => router.push(`/cours/${content.cours_id}?tab=content`)}
                    variant="outline"
                    size="lg"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour au cours complet
                </Button>
            </div>

            {/* Modal d'édition en masse */}
            {isOwner && content.granules.length > 0 && (
                <BulkEditModal
                    type={content.type}
                    contentId={id}
                    granules={content.granules}
                    isOpen={isEditing}
                    onClose={() => setIsEditing(false)}
                    onSave={() => {
                        // Recharger le contenu après sauvegarde
                        window.location.reload()
                    }}
                />
            )}
        </div>
    )
}
