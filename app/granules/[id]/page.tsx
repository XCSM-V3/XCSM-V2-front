"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    MapPin,
    Edit,
} from "lucide-react"
import { api } from "@/lib/api"
import { EditGranuleModal } from "@/components/edit/EditGranuleModal"

interface GranuleDetail {
    id: string
    titre: string
    type_contenu: string
    ordre: number
    mongo_contenu_id?: string
    cours_id?: string  // ← ID du cours pour la navigation
    chemin_hierarchique?: {
        cours: string
        partie: string
        chapitre: string
        section: string
        sous_section: string
    }
    contenu?: {
        _id: string
        type: string
        content: string  // ← Le texte brut !
        html: string
        fichier_source_id: string
        metadata?: {
            level: number
            extraction_date: string
            page?: number
        }
    }
}

export default function GranuleDetailPage() {
    const params = useParams()
    const router = useRouter()
    const granuleId = params.id as string

    const [granule, setGranule] = useState<GranuleDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isOwner, setIsOwner] = useState(false)

    useEffect(() => {
        loadGranule()
        checkOwnership()
    }, [granuleId])

    const loadGranule = async () => {
        setLoading(true)
        setError(null)

        try {
            const data = await api.getGranule(granuleId)
            setGranule(data)
        } catch (err: any) {
            console.error("Erreur chargement granule:", err)
            setError(err.message || "Impossible de charger le granule")
        } finally {
            setLoading(false)
        }
    }

    const checkOwnership = async () => {
        try {
            const userRole = localStorage.getItem("userRole")
            if (userRole === "enseignant") {
                // TODO: Vérifier via l'API si l'utilisateur est propriétaire du cours
                // Pour l'instant, on suppose que oui si c'est un enseignant
                setIsOwner(true)
            }
        } catch (err) {
            console.error("Erreur vérification propriétaire:", err)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                </div>
            </div>
        )
    }

    if (error || !granule) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error || "Granule introuvable"}</AlertDescription>
                </Alert>
                <Button onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            {/* Bouton retour */}
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-4"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Button>

            {/* Carte principale */}
            <Card>
                <CardHeader>
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <FileText className="mr-1 h-3 w-3" />
                            {granule.type_contenu}
                        </Badge>
                        <Badge variant="outline">
                            Ordre: {granule.ordre}
                        </Badge>
                        {granule.contenu?.metadata?.page && (
                            <Badge variant="outline">
                                <MapPin className="mr-1 h-3 w-3" />
                                Page {granule.contenu.metadata.page}
                            </Badge>
                        )}
                    </div>

                    {/* Titre */}
                    <CardTitle className="text-2xl">{granule.titre}</CardTitle>

                    {/* Chemin hiérarchique */}
                    <CardDescription>
                        <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
                            <BookOpen className="h-4 w-4" />
                            <span className="font-medium">{granule.chemin_hierarchique?.cours}</span>
                            <ChevronRight className="h-3 w-3" />
                            <span>{granule.chemin_hierarchique?.partie}</span>
                            <ChevronRight className="h-3 w-3" />
                            <span>{granule.chemin_hierarchique?.chapitre}</span>
                            <ChevronRight className="h-3 w-3" />
                            <span>{granule.chemin_hierarchique?.section}</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-green-600 font-medium">
                                {granule.chemin_hierarchique?.sous_section}
                            </span>
                        </div>
                    </CardDescription>
                </CardHeader>

                <Separator />

                <CardContent className="pt-6">
                    {/* Contenu principal - TEXTE BRUT */}
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            Contenu du granule
                        </h3>
                        <div className="prose prose-sm max-w-none">
                            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                                {granule.contenu?.content || "Aucun contenu disponible"}
                            </p>
                        </div>
                    </div>

                    {/* Métadonnées */}
                    {granule.contenu?.metadata && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="text-sm font-semibold text-blue-900 mb-2">
                                Métadonnées
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-blue-700 font-medium">Niveau:</span>
                                    <span className="ml-2 text-blue-900">
                                        {granule.contenu.metadata.level}
                                    </span>
                                </div>
                                {granule.contenu.metadata.page && (
                                    <div>
                                        <span className="text-blue-700 font-medium">Page source:</span>
                                        <span className="ml-2 text-blue-900">
                                            {granule.contenu.metadata.page}
                                        </span>
                                    </div>
                                )}
                                {granule.contenu.metadata.extraction_date && (
                                    <div className="col-span-2">
                                        <span className="text-blue-700 font-medium">Extrait le:</span>
                                        <span className="ml-2 text-blue-900">
                                            {new Date(granule.contenu.metadata.extraction_date).toLocaleString('fr-FR')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ID MongoDB (pour debug) */}
                    <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
                        <span className="font-mono">ID MongoDB: {granule.mongo_contenu_id}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
                <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="flex-1"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>

                {isOwner && (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Éditer
                    </Button>
                )}

                <Button
                    onClick={() => {
                        if (granule.cours_id) {
                            router.push(`/cours/${granule.cours_id}`)
                        } else {
                            alert("ID du cours non disponible")
                        }
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!granule.cours_id}
                >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Voir le cours complet
                </Button>
            </div>

            {/* Modal d'édition */}
            {isOwner && granule.contenu?.content && (
                <EditGranuleModal
                    granuleId={granule.id}
                    currentContent={granule.contenu.content}
                    isOpen={isEditing}
                    onClose={() => setIsEditing(false)}
                    onSave={() => {
                        loadGranule()
                    }}
                />
            )}
        </div>
    )
}
