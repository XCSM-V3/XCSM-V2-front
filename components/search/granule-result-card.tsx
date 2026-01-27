"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronRight, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

interface GranuleResult {
    granule_id: string
    mongo_id: string
    titre: string
    type_contenu: string
    ordre: number
    content_preview: string
    cours: {
        id: string
        titre: string
        code: string
    }
    chemin_hierarchique: {
        partie: string
        chapitre: string
        section: string
        sous_section: string
    }
    enseignant: string
    source_pdf_page: number | null
}

interface GranuleResultCardProps {
    result: GranuleResult
    searchQuery?: string
}

export function GranuleResultCard({ result, searchQuery }: GranuleResultCardProps) {
    const router = useRouter()

    const highlightText = (text: string, query?: string) => {
        if (!query) return text

        const parts = text.split(new RegExp(`(${query})`, 'gi'))
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase() ? (
                        <mark key={i} className="bg-yellow-200 font-semibold">{part}</mark>
                    ) : (
                        part
                    )
                )}
            </span>
        )
    }

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between mb-2">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        {result.cours.code}
                    </Badge>
                    {result.source_pdf_page && (
                        <Badge variant="outline" className="text-xs">
                            Page {result.source_pdf_page}
                        </Badge>
                    )}
                </div>
                <CardTitle className="text-lg line-clamp-2">
                    {highlightText(result.titre, searchQuery)}
                </CardTitle>
                <CardDescription className="text-xs">
                    <div className="flex items-center gap-1 text-gray-500 flex-wrap">
                        <span>{result.chemin_hierarchique.partie}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span>{result.chemin_hierarchique.chapitre}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span>{result.chemin_hierarchique.section}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="font-medium">{result.chemin_hierarchique.sous_section}</span>
                    </div>
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="space-y-3">
                    {/* Aperçu du contenu */}
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        <p className="line-clamp-3">
                            {highlightText(result.content_preview, searchQuery)}
                        </p>
                    </div>

                    {/* Métadonnées */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{result.cours.titre}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{result.type_contenu}</span>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500">
                        Par {result.enseignant}
                    </div>

                    {/* Actions */}
                    <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => router.push(`/cours/${result.cours.id}`)}
                    >
                        Voir dans le cours
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
