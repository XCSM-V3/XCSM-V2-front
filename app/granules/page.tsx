"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, FileText, Edit, Trash2, Eye } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

export default function GranulesPage() {
    const [granules, setGranules] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCours, setSelectedCours] = useState<string | null>(null)

    const loadGranules = async (coursId?: string) => {
        setLoading(true)
        try {
            const params = coursId ? `?cours_id=${coursId}` : ""
            const response = await api.get<any>(`/granules/${params}`)
            setGranules(response.data.granules || [])
        } catch (error) {
            console.error("Erreur chargement granules:", error)
            toast({
                title: "Erreur",
                description: "Impossible de charger les granules",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (granuleId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce granule ?")) return

        try {
            await api.delete(`/granules/${granuleId}/`)
            toast({
                title: "Succès",
                description: "Granule supprimé"
            })
            loadGranules(selectedCours || undefined)
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de supprimer le granule",
                variant: "destructive"
            })
        }
    }

    useEffect(() => {
        loadGranules()
    }, [])

    const filteredGranules = granules.filter(g =>
        g.titre.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Gestion des Granules</h1>
                <p className="text-muted-foreground">
                    Visualisez et gérez tous les granules de vos cours
                </p>
            </div>

            <div className="mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un granule..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button onClick={() => loadGranules()}>
                    Rafraîchir
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Chargement...</div>
            ) : (
                <div className="grid gap-4">
                    {filteredGranules.map((granule) => (
                        <Card key={granule.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{granule.titre}</CardTitle>
                                        <CardDescription>
                                            {granule.chemin_hierarchique?.cours} → {granule.chemin_hierarchique?.chapitre}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => window.location.href = `/granules/${granule.id}`}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleDelete(granule.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Badge>{granule.type_contenu}</Badge>
                                    <Badge variant="outline">Ordre: {granule.ordre}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredGranules.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            Aucun granule trouvé
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
