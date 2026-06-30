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
import { FileText, ArrowLeft, Eye, BookOpen, Calendar, Users, UploadCloud, Loader2, UserPlus, Trash2 } from "lucide-react"
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
    const [uploadProgress, setUploadProgress] = useState(0)

    // Co-teachers states
    const [isCoTeachersOpen, setIsCoTeachersOpen] = useState(false)
    const [coTeachers, setCoTeachers] = useState<any[]>([])
    const [allTeachers, setAllTeachers] = useState<any[]>([])
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [coTeachersLoading, setCoTeachersLoading] = useState(false)

    const { toast } = useToast()

    const isOwner = user?.role === "enseignant" && matiere && (matiere.enseignant === user.profil_id)

    useEffect(() => {
        if (params.id) {
            fetchMatiereDetails()
        }
    }, [params.id])

    useEffect(() => {
        if (isOwner && params.id) {
            matiereService.getCoTeachers(params.id as string)
                .then(setCoTeachers)
                .catch(console.error)
        }
    }, [isOwner, params.id])

    useEffect(() => {
        if (isCoTeachersOpen) {
            matiereService.getAllTeachers()
                .then(setAllTeachers)
                .catch(console.error)
        }
    }, [isCoTeachersOpen])

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
        setUploadProgress(0)

        try {
            await api.uploadDocument(
                uploadFile,
                uploadTitle || uploadFile.name,
                params.id as string,
                (progress) => setUploadProgress(progress)
            )

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
            setUploadProgress(0)
        }
    }

    const handleAddCoTeachers = async () => {
        if (selectedTeacherIds.length === 0) return
        setCoTeachersLoading(true)
        try {
            await matiereService.addCoTeachers(params.id as string, selectedTeacherIds)
            toast({ title: "Succès", description: "Co-enseignant(s) ajouté(s) avec succès !" })
            setSelectedTeacherIds([])
            const list = await matiereService.getCoTeachers(params.id as string)
            setCoTeachers(list)
            fetchMatiereDetails()
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || "Impossible d'ajouter ces enseignants"
            toast({
                title: "Erreur",
                description: errorMsg,
                variant: "destructive"
            })
        } finally {
            setCoTeachersLoading(false)
        }
    }

    const toggleTeacherSelection = (id: string) => {
        if (selectedTeacherIds.includes(id)) {
            setSelectedTeacherIds(selectedTeacherIds.filter(tid => tid !== id))
        } else {
            setSelectedTeacherIds([...selectedTeacherIds, id])
        }
    }

    const handleRemoveCoTeacher = async (teacherId: string) => {
        if (!confirm("Voulez-vous vraiment retirer ce co-enseignant ?")) return
        setCoTeachersLoading(true)
        try {
            await matiereService.removeCoTeacher(params.id as string, teacherId)
            toast({ title: "Succès", description: "Co-enseignant retiré avec succès !" })
            const list = await matiereService.getCoTeachers(params.id as string)
            setCoTeachers(list)
            fetchMatiereDetails()
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Impossible de retirer cet enseignant",
                variant: "destructive"
            })
        } finally {
            setCoTeachersLoading(false)
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
                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                                <div className="flex items-center"><Users className="h-4 w-4 mr-2" /> {matiere.nb_etudiants} inscrits</div>
                                <div className="flex items-center"><FileText className="h-4 w-4 mr-2" /> {matiere.nb_cours} cours</div>
                                <div className="flex items-center"><Calendar className="h-4 w-4 mr-2" /> Créé le {new Date(matiere.date_creation).toLocaleDateString()}</div>
                                <div className="flex items-center"><Users className="h-4 w-4 mr-2" /> Enseignant(s) : {matiere.enseignants_noms?.join(", ") || matiere.enseignant_nom}</div>
                            </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            {isOwner && (
                                <Button variant="outline" className="border-border hover:bg-accent gap-2" onClick={() => setIsCoTeachersOpen(true)}>
                                    <Users className="h-4 w-4" /> Co-enseignants
                                </Button>
                            )}
                            {user?.role === "enseignant" && (
                                <Button className="bg-green-600 hover:bg-green-700 shadow-lg gap-2" onClick={() => setIsUploadOpen(true)}>
                                    <UploadCloud className="h-4 w-4" /> Ajouter un Document
                                </Button>
                            )}
                        </div>
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
                                        <Button variant="outline" size="sm" asChild className="border-primary/20 text-primary hover:bg-primary/5">
                                            <Link href={`/cours/${c.id}/apercu`}>
                                                <Eye className="mr-2 h-3.5 w-3.5" /> Aperçu
                                            </Link>
                                        </Button>
                                        <Button variant="secondary" size="sm" asChild>
                                            <Link href={`/cours/${c.id}`}>
                                                <BookOpen className="mr-2 h-3.5 w-3.5" /> Ouvrir
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
                    <DialogFooter className="flex-col items-stretch sm:flex-row sm:justify-end gap-2">
                        {isUploading && uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="flex-1 mr-4 flex items-center">
                                <div className="w-full bg-muted rounded-full h-2.5">
                                    <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                                <span className="text-xs text-muted-foreground ml-2">{uploadProgress}%</span>
                            </div>
                        )}
                        <Button onClick={handleUpload} disabled={!uploadFile || isUploading}>
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                            {isUploading ? (uploadProgress === 100 ? "Traitement backend..." : "Upload en cours...") : "Uploader et Créer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Co-enseignants */}
            <Dialog open={isCoTeachersOpen} onOpenChange={setIsCoTeachersOpen}>
                <DialogContent className="max-w-md md:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                            <Users className="h-6 w-6 text-primary" /> Collaborateurs
                        </DialogTitle>
                        <DialogDescription>
                            Gérez les collègues qui co-enseignent et collaborent sur cette matière.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-2">
                        {/* Section 1: Ajouter de nouveaux collaborateurs */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-foreground">
                                Ajouter des enseignants
                            </Label>
                            
                            <Input
                                type="text"
                                placeholder="Rechercher par nom, spécialité ou email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                            />

                            {/* Liste scrollable des enseignants disponibles */}
                            <div className="border rounded-lg p-2 max-h-[180px] overflow-y-auto space-y-1.5 bg-muted/20">
                                {(() => {
                                    const available = allTeachers.filter(t => 
                                        t.id !== matiere?.enseignant && 
                                        !coTeachers.some(ct => ct.id === t.id)
                                    );
                                    const filtered = available.filter(t => {
                                        const q = searchQuery.toLowerCase();
                                        const nom = t.nom_complet?.toLowerCase() || "";
                                        const email = t.utilisateur?.email?.toLowerCase() || "";
                                        const spec = t.specialite?.toLowerCase() || "";
                                        return nom.includes(q) || email.includes(q) || spec.includes(q);
                                    });

                                    if (available.length === 0) {
                                        return (
                                            <p className="text-sm text-muted-foreground italic py-4 text-center">
                                                Aucun autre enseignant disponible dans l'écosystème.
                                            </p>
                                        );
                                    }

                                    if (filtered.length === 0) {
                                        return (
                                            <p className="text-sm text-muted-foreground italic py-4 text-center">
                                                Aucun enseignant ne correspond à la recherche.
                                            </p>
                                        );
                                    }

                                    return filtered.map((t: any) => (
                                        <div 
                                            key={t.id} 
                                            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all hover:bg-accent/50 ${selectedTeacherIds.includes(t.id) ? "border-primary/50 bg-primary/5" : "border-transparent bg-background"}`}
                                            onClick={() => toggleTeacherSelection(t.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedTeacherIds.includes(t.id)}
                                                onChange={() => {}} // géré par le parent
                                                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-sm text-foreground truncate">
                                                    {t.nom_complet}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {t.utilisateur?.email} • {t.specialite}
                                                </p>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>

                            {selectedTeacherIds.length > 0 && (
                                <div className="flex justify-end">
                                    <Button 
                                        className="bg-primary hover:bg-primary/95 flex items-center gap-2 shadow"
                                        onClick={handleAddCoTeachers} 
                                        disabled={coTeachersLoading}
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Ajouter la sélection ({selectedTeacherIds.length})
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="border-t my-1"></div>

                        {/* Section 2: Collaborateurs actuels */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-foreground uppercase tracking-wider text-xs text-muted-foreground">
                                Collaborateurs actuels ({coTeachers.length})
                            </Label>
                            {coTeachers.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic py-3 text-center bg-muted/10 rounded-lg border border-dashed">
                                    Aucun co-enseignant n'a été ajouté à cette matière.
                                </p>
                            ) : (
                                <div className="grid gap-2 max-h-[160px] overflow-y-auto pr-1">
                                    {coTeachers.map((ct: any) => (
                                        <div key={ct.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border text-sm hover:bg-muted/60 transition-all">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-foreground truncate">
                                                    {ct.nom_complet || ct.utilisateur?.email}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {ct.utilisateur?.email} • {ct.specialite || "Enseignant"}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full"
                                                onClick={() => handleRemoveCoTeacher(ct.id)}
                                                disabled={coTeachersLoading}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
