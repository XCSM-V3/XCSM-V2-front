"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    FileText,
    Trash2,
    File,
    Calendar,
    AlertCircle,
    Search,
    Pencil,
    Eye,
    Plus,
    Loader2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { api, Document } from "@/lib/api"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"

export default function DocumentsPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const { toast } = useToast()
    const [documents, setDocuments] = useState<Document[]>([])
    const [filteredDocs, setFilteredDocs] = useState<Document[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            loadDocuments()
        }
    }, [authLoading, isAuthenticated])

    const loadDocuments = async () => {
        try {
            setIsLoading(true)
            const docs = await api.getDocuments()
            setDocuments(docs)
            setFilteredDocs(docs)
        } catch (error) {
            console.error(error)
            toast({
                title: "Erreur",
                description: "Impossible de charger les documents.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            setDeletingId(id)
            await api.deleteDocument(id)
            const remaining = documents.filter(d => d.id !== id)
            setDocuments(remaining)
            setFilteredDocs(remaining.filter(d => d.titre.toLowerCase().includes(searchQuery.toLowerCase())))
            toast({
                title: "Succès",
                description: "Document supprimé.",
            })
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de supprimer le document.",
                variant: "destructive",
            })
        } finally {
            setDeletingId(null)
        }
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        if (!query) {
            setFilteredDocs(documents)
        } else {
            setFilteredDocs(documents.filter(doc =>
                doc.titre.toLowerCase().includes(query.toLowerCase())
            ))
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const getFileIcon = (type: string) => {
        if (type === 'PDF') return <FileText className="h-5 w-5 text-red-500" />
        if (type === 'DOCX') return <FileText className="h-5 w-5 text-blue-500" />
        return <File className="h-5 w-5 text-gray-500" />
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mes Documents</h1>
                    <p className="text-muted-foreground mt-2">
                        Gérez vos fichiers importés (PDF, DOCX, TXT). Taille max: 50 Mo.
                    </p>
                </div>
                <Button asChild className="bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md hover:shadow-lg transition-all">
                    <Link href="/importer-document">
                        <Plus className="mr-2 h-4 w-4" />
                        Importer un document
                    </Link>
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Rechercher un document..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-t-4 border-primary shadow-md">
                <CardHeader>
                    <CardTitle>Historique des uploads</CardTitle>
                    <CardDescription>
                        Liste de vos documents transformés et disponibles pour l'édition.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground">
                            <File className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Aucun document trouvé.</p>
                            <Button variant="link" asChild className="mt-2 text-primary">
                                <Link href="/importer-document">Commencer par importer un fichier</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>Nom du fichier</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Date d'import</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDocs.map((doc) => (
                                        <TableRow key={doc.id} className="hover:bg-muted/50">
                                            <TableCell>{getFileIcon(doc.type_fichier)}</TableCell>
                                            <TableCell className="font-medium">
                                                {doc.titre}
                                            </TableCell>
                                            <TableCell>{doc.type_fichier}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(doc.date_upload)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${doc.statut_traitement === 'TRAITE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    doc.statut_traitement === 'ERREUR' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {doc.statut_traitement}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                        disabled={doc.statut_traitement !== 'TRAITE'}
                                                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Link href={`/dashboard/editeur?id=${doc.id}`}>
                                                            <Pencil className="h-4 w-4 mr-1" />
                                                            Corriger
                                                        </Link>
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        disabled={doc.statut_traitement !== 'TRAITE'}
                                                    >
                                                        <Link href={`/dashboard/editeur?id=${doc.id}&mode=view`}>
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Voir
                                                        </Link>
                                                    </Button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                                {deletingId === doc.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Cette action est irréversible. Cela supprimera le document "{doc.titre}" et tous les cours/granules associés.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(doc.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Supprimer
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <Card className="bg-muted/50 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                        <div>
                            <p className="font-semibold text-foreground">Formats</p>
                            <p>PDF, DOCX, TXT supportés</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-muted/50 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-primary" />
                        <div>
                            <p className="font-semibold text-foreground">Traitement</p>
                            <p>Découpage auto en granules</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-muted/50 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Trash2 className="h-5 w-5 text-orange-500" />
                        <div>
                            <p className="font-semibold text-foreground">Suppression</p>
                            <p>Supprime aussi le cours généré</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
