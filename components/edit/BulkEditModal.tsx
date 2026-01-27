"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

interface BulkEditModalProps {
    type: "cours" | "partie" | "chapitre" | "section" | "sous_section"
    contentId: string
    granules: Array<{
        id: string
        contenu?: {
            content: string
        }
    }>
    isOpen: boolean
    onClose: () => void
    onSave: () => void
}

export function BulkEditModal({
    type,
    contentId,
    granules,
    isOpen,
    onClose,
    onSave,
}: BulkEditModalProps) {
    // Combiner tous les contenus des granules
    const initialContent = granules
        .map((g) => g.contenu?.content || "")
        .join("\n\n")

    const [content, setContent] = useState(initialContent)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    const handleSave = async () => {
        setSaving(true)
        setError(null)

        try {
            // Diviser le contenu en paragraphes (séparés par double saut de ligne)
            const paragraphs = content.split(/\n\n+/).filter(p => p.trim())

            // Créer les données pour chaque granule
            const granulesData = granules.map((granule, index) => ({
                id: granule.id,
                contenu: paragraphs[index] || ""  // Si moins de paragraphes, mettre vide
            }))

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/contenu/bulk-edit/`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: JSON.stringify({
                        type,
                        id: contentId,
                        granules: granulesData
                    })
                }
            )

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Échec de la mise à jour')
            }

            const result = await response.json()

            if (result.errors && result.errors.length > 0) {
                toast({
                    title: "Mise à jour partielle",
                    description: `${result.updated || granules.length} granules mis à jour, ${result.errors.length} erreurs.`,
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "Granules modifiés",
                    description: `${granules.length} granules ont été mis à jour avec succès.`,
                })
            }

            onSave()
            onClose()
        } catch (err: any) {
            console.error('Erreur édition en masse:', err)
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const getTypeLabel = () => {
        const labels = {
            cours: "cours",
            partie: "partie",
            chapitre: "chapitre",
            section: "section",
            sous_section: "sous-section"
        }
        return labels[type]
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Éditer le {getTypeLabel()}</DialogTitle>
                    <DialogDescription>
                        Modifiez le contenu complet ci-dessous. Séparez les granules par une ligne vide (double saut de ligne).
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 flex-1 overflow-hidden">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={25}
                        className="font-mono text-sm resize-none h-full"
                        placeholder="Contenu du chapitre/section..."
                    />
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                            {content.length} caractères • {granules.length} granules
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Séparez les granules par une ligne vide
                        </p>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || content === initialContent}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Enregistrer {granules.length} granules
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
