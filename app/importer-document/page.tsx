"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { api } from "@/lib/api"

export default function ImportDocumentPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [titre, setTitre] = useState("")
  const [uploadStatus, setUploadStatus] = useState<{
    status: "idle" | "uploading" | "processing" | "success" | "error"
    progress: number
    message: string
  }>({
    status: "idle",
    progress: 0,
    message: "",
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Vérifier le type de fichier
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
      ]
      if (!validTypes.includes(selectedFile.type)) {
        alert("Seuls les fichiers PDF et DOCX sont acceptés")
        return
      }

      // Vérifier la taille (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        alert("Le fichier ne doit pas dépasser 50MB")
        return
      }

      setFile(selectedFile)
      if (!titre) {
        // Extraire le nom sans extension
        const name = selectedFile.name.replace(/\.(pdf|docx)$/i, "")
        setTitre(name)
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      // Simuler un changement de fichier
      const input = fileInputRef.current
      if (input) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(droppedFile)
        input.files = dataTransfer.files
        handleFileChange({ target: input } as any)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleUpload = async () => {
    if (!file || !titre.trim()) {
      alert("Veuillez sélectionner un fichier et entrer un titre")
      return
    }

    setUploadStatus({
      status: "uploading",
      progress: 30,
      message: "Upload du document en cours...",
    })

    try {
      // Upload réel via l'API
      const result = await api.uploadDocument(file, titre)

      setUploadStatus({
        status: "processing",
        progress: 60,
        message: "Traitement et analyse du document...",
      })

      // Attendre un peu pour simuler le traitement
      await new Promise((resolve) => setTimeout(resolve, 2000))

      if (result.statut === "EN_ATTENTE" || result.statut === "TRAITE" || result.id) {
        setUploadStatus({
          status: "success",
          progress: 100,
          message: "Upload réussi ! Traitement en arrière-plan.",
        })

        // Rediriger vers l'éditeur de ce document
        setTimeout(() => {
          router.push(`/dashboard/editeur?id=${result.id}`)
        }, 1500)
      } else {
        throw new Error("Réponse inattendue du serveur")
      }
    } catch (error: any) {
      setUploadStatus({
        status: "error",
        progress: 0,
        message: error.message || "Erreur lors de l'upload",
      })
    }
  }

  const resetForm = () => {
    setFile(null)
    setTitre("")
    setUploadStatus({ status: "idle", progress: 0, message: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getFileIcon = () => {
    if (!file) return <Upload className="h-12 w-12 text-gray-400" />
    if (file.type === "application/pdf") {
      return <FileText className="h-12 w-12 text-red-500" />
    }
    return <FileText className="h-12 w-12 text-blue-500" />
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>

        {/* Titre principal */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Importer un document
          </h1>
          <p className="text-lg text-gray-600">
            Uploadez un document PDF ou DOCX pour créer du contenu
          </p>
        </div>

        {/* Formulaire d'upload */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Upload de document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Zone de drop */}
            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Cliquez pour sélectionner ou glissez un fichier
                </p>
                <p className="text-sm text-gray-500">
                  Formats acceptés : PDF, DOCX, TXT • Taille max : 50MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <>
                {/* Fichier sélectionné */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {getFileIcon()}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {file.type === "application/pdf" ? "PDF" : "DOCX"}
                    </p>
                  </div>
                  {uploadStatus.status === "idle" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={resetForm}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                {/* Titre du document */}
                {uploadStatus.status === "idle" && (
                  <div className="space-y-2">
                    <Label htmlFor="titre" className="text-base font-medium">
                      Titre du document
                    </Label>
                    <Input
                      id="titre"
                      value={titre}
                      onChange={(e) => setTitre(e.target.value)}
                      placeholder="Entrez un titre pour le document"
                      className="text-base"
                    />
                    <p className="text-sm text-gray-500">
                      Ce titre sera utilisé pour identifier le document
                    </p>
                  </div>
                )}

                {/* Statut de l'upload */}
                {uploadStatus.status !== "idle" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {uploadStatus.status === "uploading" && (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      )}
                      {uploadStatus.status === "processing" && (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      )}
                      {uploadStatus.status === "success" && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                      {uploadStatus.status === "error" && (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {uploadStatus.message}
                      </span>
                    </div>

                    {(uploadStatus.status === "uploading" ||
                      uploadStatus.status === "processing") && (
                        <Progress value={uploadStatus.progress} className="h-2" />
                      )}
                  </div>
                )}

                {/* Boutons d'action */}
                {uploadStatus.status === "idle" && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      className="flex-1"
                    >
                      Changer de fichier
                    </Button>
                    <Button
                      onClick={handleUpload}
                      className="flex-1 bg-primary hover:bg-primary/90"
                      disabled={!titre.trim()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Uploader et traiter
                    </Button>
                  </div>
                )}

                {uploadStatus.status === "error" && (
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="w-full"
                  >
                    Réessayer
                  </Button>
                )}

                {uploadStatus.status === "success" && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                    <CheckCircle className="h-12 w-12 text-primary mx-auto mb-2" />
                    <p className="font-medium text-primary">
                      Redirection vers vos cours...
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Informations sur le traitement */}
            {uploadStatus.status === "idle" && file && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  🔄 Traitement automatique
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Extraction du texte et de la structure</li>
                  <li>• Découpage en parties et chapitres</li>
                  <li>• Création de granules pédagogiques</li>
                  <li>• Indexation pour la recherche</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section aide */}
        {!file && (
          <div className="max-w-3xl mx-auto mt-8">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  📚 Formats de documents supportés
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <h4 className="font-medium mb-2">📄 PDF</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Extraction de texte natif</li>
                      <li>• Structure préservée</li>
                      <li>• Images et graphiques</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">📝 DOCX</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Formatage conservé</li>
                      <li>• Titres et sections</li>
                      <li>• Tableaux et listes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}