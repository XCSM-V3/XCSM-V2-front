"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    FileText,
    Plus,
    Search,
    Users,
    BookOpen,
    Calendar,
    Loader2,
    School,
    Hash
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import matiereService from "@/services/matiere-service"

interface Matiere {
    id: string
    titre: string
    code: string
    description: string
    enseignant_nom: string
    nb_etudiants: number
    nb_cours: number
    date_creation: string
}

export default function MatieresPage() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const [matieres, setMatieres] = useState<Matiere[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Dialog States
    const [isJoinOpen, setIsJoinOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [joinCode, setJoinCode] = useState("")
    const [newMatiere, setNewMatiere] = useState({ titre: "", code: "", description: "" })
    const [dialogLoading, setDialogLoading] = useState(false)

    const { toast } = useToast()

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchMatieres()
        }
    }, [authLoading, isAuthenticated])

    const fetchMatieres = async () => {
        setIsLoading(true)
        try {
            const data = await matiereService.getAllMatieres()
            // Si pagination, adapter ici (ex: data.results)
            setMatieres(Array.isArray(data) ? data : (data.results || []))
        } catch (error) {
            console.error("Erreur:", error)
            toast({
                title: "Erreur",
                description: "Impossible de charger les matières",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleJoinMatiere = async () => {
        if (!joinCode) return
        setDialogLoading(true)
        try {
            await matiereService.joinMatiere(joinCode)
            toast({ title: "Succès", description: "Vous avez rejoint la classe !" })
            setIsJoinOpen(false)
            fetchMatieres()
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Code invalide ou erreur serveur",
                variant: "destructive"
            })
        } finally {
            setDialogLoading(false)
        }
    }

    const handleCreateMatiere = async () => {
        if (!newMatiere.titre || !newMatiere.code) {
            toast({ title: "Erreur", description: "Titre et Code requis", variant: "destructive" })
            return
        }
        setDialogLoading(true)
        try {
            await matiereService.createMatiere(newMatiere)
            toast({ title: "Succès", description: "Matière créée avec succès" })
            setIsCreateOpen(false)
            fetchMatieres()
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: "Erreur lors de la création (Vérifiez si le code est unique)",
                variant: "destructive"
            })
        } finally {
            setDialogLoading(false)
        }
    }

    const filteredMatieres = matieres.filter(
        (m) =>
            m.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (isLoading) {
        return (
            <div className="p-6 flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-green-600" />
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Mes Matières</h1>
                    <p className="text-muted-foreground mt-1">
                        {user?.role === "enseignant"
                            ? "Gérez vos classes et vos enseignements"
                            : "Retrouvez vos cours classés par matière"}
                    </p>
                </div>
                <div className="flex gap-2">
                    {user?.role === "enseignant" ? (
                        <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={() => setIsCreateOpen(true)}>
                            <Plus className="h-4 w-4" /> Nouvelle Matière
                        </Button>
                    ) : (
                        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsJoinOpen(true)}>
                            <School className="h-4 w-4" /> Rejoindre une classe
                        </Button>
                    )}
                </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                    placeholder="Rechercher une matière ou un code..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Liste des matières */}
            {filteredMatieres.length === 0 ? (
                <Card className="text-center py-16">
                    <CardContent>
                        <School className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">Aucune matière trouvée</h3>
                        <p className="text-muted-foreground">
                            {user?.role === "enseignant" ? "Créez votre première matière pour commencer." : "Rejoignez une classe avec votre code."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMatieres.map((matiere) => (
                        <Card key={matiere.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary/60">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="mb-2 text-md px-3 py-1 font-mono tracking-wider">
                                        {matiere.code}
                                    </Badge>
                                    {user?.role === "enseignant" && (
                                        <Badge variant="secondary"><Users className="h-3 w-3 mr-1" /> {matiere.nb_etudiants}</Badge>
                                    )}
                                </div>
                                <CardTitle className="text-xl">{matiere.titre}</CardTitle>
                                <CardDescription className="line-clamp-2">{matiere.description || "Aucune description"}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        <span>{matiere.nb_cours} documents/cours</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Créé le {new Date(matiere.date_creation).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline" asChild>
                                    <Link href={`/dashboard/matieres/${matiere.id}`}>Voir les cours</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Dialog: Rejoindre (Etudiant) */}
            <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejoindre une classe</DialogTitle>
                        <DialogDescription>Entrez le code unique fourni par votre enseignant.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="code" className="text-right">Code Matière</Label>
                        <div className="relative mt-2">
                            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input id="code" className="pl-9 font-mono uppercase" placeholder="EX: PHY2026" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleJoinMatiere} disabled={!joinCode || dialogLoading}>
                            {dialogLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rejoindre"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: Créer (Enseignant) */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nouvelle Matière</DialogTitle>
                        <DialogDescription>Créez un espace pour regrouper vos cours.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="titre">Titre</Label>
                            <Input id="titre" placeholder="Ex: Physique Quantique" value={newMatiere.titre} onChange={(e) => setNewMatiere({ ...newMatiere, titre: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="code-create">Code d'accès (Unique)</Label>
                            <Input id="code-create" className="font-mono uppercase" placeholder="Ex: PHY2026" value={newMatiere.code} onChange={(e) => setNewMatiere({ ...newMatiere, code: e.target.value.toUpperCase() })} />
                            <p className="text-xs text-muted-foreground">Ce code sera partagé aux étudiants.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="desc">Description</Label>
                            <Input id="desc" placeholder="Optionnel" value={newMatiere.description} onChange={(e) => setNewMatiere({ ...newMatiere, description: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateMatiere} disabled={!newMatiere.titre || !newMatiere.code || dialogLoading}>
                            {dialogLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
