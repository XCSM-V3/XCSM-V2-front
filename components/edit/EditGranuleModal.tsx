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
import { Loader2, Save } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface EditGranuleModalProps {
    granuleId: string
    currentContent: string
    isOpen: boolean
    onClose: () => void
    onSave: () => void
}

export function EditGranuleModal({
    granuleId,
    currentContent,
    isOpen,
    onClose,
    onSave,
}: EditGranuleModalProps) {
    const [content, setContent] = useState(currentContent)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    const handleSave = async () => {
        setSaving(true)
        setError(null)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/granules/${granuleId}/update/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ contenu: content })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Échec de la mise à jour')
            }

            toast({
                title: "Granule modifié",
                description: "Le granule a été mis à jour avec succès.",
            })

            onSave()
            onClose()
        } catch (err: any) {
            console.error('Erreur édition:', err)
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Éditer le granule</DialogTitle>
                    <DialogDescription>
                        Modifiez le contenu du granule ci-dessous. Les modifications seront enregistrées immédiatement.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={20}
                        className="font-mono text-sm resize-none"
                        placeholder="Contenu du granule..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        {content.length} caractères
                    </p>
                </div>

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                        <strong>Erreur :</strong> {error}
                    </div>
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
                        disabled={saving || content === currentContent}
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
                                Enregistrer
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
