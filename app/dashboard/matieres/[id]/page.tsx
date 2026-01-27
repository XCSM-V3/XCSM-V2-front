"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { FileText, ArrowLeft, Eye, BookOpen, Calendar, Users, UploadCloud, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import matiereService from "@/services/matiere-service"
import documentsService from "@/services/documents-service"
import { api } from "@/lib/api" // IMPORT DIRECT CORRECT

export default function MatiereDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const [matiere, setMatiere] = useState<any>(null)
    const [cours, setCours] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [uploadTitle, setUploadTitle] = useState("")
    const [isUploading, setIsUploading] = useState(false)

    const { toast } = useToast()

    useEffect(() => {
        if (params.id) {
            fetchMatiereDetails()
        }
    }, [params.id])

    const fetchMatiereDetails = async () => {
        setIsLoading(true)
        try {
            // 1. Infos Matière
            const data = await matiereService.getMatiereById(params.id as string)
            setMatiere(data)

            // 2. Cours associés
            // Utilisation directe de l'API importée correctement
            try {
                const res = await api.get(`cours/?matiere_id=${params.id}`)
                // Robustesse : Gestion des différents formats de réponse DRF (Pagination vs Liste)
                const coursesList = Array.isArray(res.data) ? res.data : (res.data?.results || [])
                setCours(coursesList)
            } catch (e) {
                console.error("Erreur chargement cours:", e)
                setCours([]) // Fallback to empty array
            }

        } catch (error) {
            console.error("Erreur matière:", error)
            toast({ title: "Erreur", description: "Matière introuvable", variant: "destructive" })
            router.push("/dashboard/matieres")
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpload = async () => {
        if (!uploadFile) return
        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append("fichier_original", uploadFile)
            formData.append("titre", uploadTitle || uploadFile.name)
            formData.append("matiere", params.id as string)

            // Use api.uploadDocument wrapper directly if service fails, but service import is fixed now.
            // documentsService logic uses api.uploadDocument which expects 2 args.
            // Wait, documentsService.uploadDocument(file, titre) does NOT accept 'matiere' arg in my previous reading.
            // I need to use the RAW API call here because 'uploadDocument' service method signature is rigid.

            await api.request("/documents/upload/", {
                method: "POST",
                body: formData
            }, true) // true = isFormData

            toast({ title: "Succès", description: "Document envoyé pour traitement." })
            setIsUploadOpen(false)
            setUploadFile(null)
            setUploadTitle("")

            toast({ title: "Traitement en cours", description: "Le cours apparaîtra dans quelques instants." })

            // Refresh list after delay
            setTimeout(fetchMatiereDetails, 2000)

        } catch (error: any) {
            toast({
                title: "Erreur Upload",
                description: error.response?.data?.error || error.message || "Echec de l'envoi",
                variant: "destructive"
            })
        } finally {
            setIsUploading(false)
        }
    }

    if (isLoading && !matiere) return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="p-6">
            <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:underline" onClick={() => router.push("/dashboard/matieres")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux matières
            </Button>

            {matiere && (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold">{matiere.titre}</h1>
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-mono font-bold tracking-wider border border-primary/20">
                                    {matiere.code}
                                </span>
                            </div>
                            <p className="text-muted-foreground text-lg opacity-90">{matiere.description || "Aucune description"}</p>
                            <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                                <div className="flex items-center"><Users className="h-4 w-4 mr-2" /> {matiere.nb_etudiants} inscrits</div>
                                <div className="flex items-center"><FileText className="h-4 w-4 mr-2" /> {matiere.nb_cours} cours</div>
                                <div className="flex items-center"><Calendar className="h-4 w-4 mr-2" /> Créé le {new Date(matiere.date_creation).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {user?.role === "enseignant" && (
                            <Button className="bg-green-600 hover:bg-green-700 shadow-lg" onClick={() => setIsUploadOpen(true)}>
                                <UploadCloud className="mr-2 h-4 w-4" /> Ajouter un Document
                            </Button>
                        )}
                    </div>

                    <div className="border-t border-border my-8"></div>

                    <h2 className="text-2xl font-semibold mb-6 flex items-center">
                        <BookOpen className="mr-2 h-6 w-6 text-primary" /> Contenus du cours
                    </h2>

                    {Array.isArray(cours) && cours.length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                            <p className="text-muted-foreground mb-4">Aucun contenu disponible pour le moment.</p>
                            {user?.role === "enseignant" && (
                                <Button variant="outline" onClick={() => setIsUploadOpen(true)}>Commencer par uploader un PDF</Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {Array.isArray(cours) && cours.map((c: any) => (
                                <Card key={c.id} className="flex flex-row items-center p-4 hover:shadow-md transition-all gap-4">
                                    <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg truncate">{c.titre}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-1">{c.description}</p>
                                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                            <span>{new Date(c.date_creation).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{c.nb_parties || 0} chapitres</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" size="sm" asChild>
                                            <Link href={`/cours/${c.id}`}>
                                                <Eye className="mr-2 h-3 w-3" /> Ouvrir
                                            </Link>
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Dialog Upload */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter un Document</DialogTitle>
                        <DialogDescription>Le document sera analysé et converti en cours interactif.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Nom du cours (Optionnel)</Label>
                            <Input placeholder="Laisser vide pour utiliser le nom du fichier" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Fichier (PDF, Word, Txt)</Label>
                            <Input type="file" accept=".pdf,.docx,.txt" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpload} disabled={!uploadFile || isUploading}>
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                            {isUploading ? "Traitement..." : "Uploader et Créer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
