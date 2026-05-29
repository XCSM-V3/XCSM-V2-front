"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FileUp, Loader2, ArrowLeft, CheckCircle, AlertCircle, FileText } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function ImportDocumentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [titre, setTitre] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedDoc, setUploadedDoc] = useState<{ id: string; message: string } | null>(null)
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!titre) {
        // Pré-remplir le titre avec le nom du fichier (sans extension)
        setTitre(file.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!titre) {
        setTitre(file.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedFile) {
      setError("Veuillez sélectionner un fichier.")
      return
    }
    if (!titre.trim()) {
      setError("Veuillez donner un titre au document.")
      return
    }

    setIsLoading(true)
    try {
      const result = await api.uploadDocument(selectedFile, titre.trim())
      setUploadedDoc({ id: result.id, message: result.message || "Document uploadé avec succès !" })
      toast({
        title: "Upload réussi !",
        description: "Le traitement IA est en cours. Vous serez notifié quand le cours sera prêt.",
      })
    } catch (err: any) {
      if (err?.name === "TimeoutError" || err?.name === "AbortError") {
        setError("Le serveur met trop de temps à répondre. Réessayez dans quelques secondes.")
      } else {
        setError(err.message || "Une erreur est survenue lors de l'upload.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ── Succès ───────────────────────────────────────────────────────────────
  if (uploadedDoc) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-lg w-full text-center">
            <CardContent className="pt-10 pb-8 space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Document uploadé !</h2>
                <p className="text-muted-foreground">{uploadedDoc.message}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  L'IA (Gemini) va maintenant analyser et structurer votre document en granules pédagogiques. Cela prend généralement 30–120 secondes selon la taille.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => { setUploadedDoc(null); setSelectedFile(null); setTitre("") }}>
                  Importer un autre document
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => router.push("/dashboard")}>
                  Retour au tableau de bord
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // ── Formulaire ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Importer un document</h1>
          <p className="text-lg text-muted-foreground">
            Uploadez un PDF ou DOCX — l'IA le transforme en cours structuré automatiquement
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileUp className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <CardTitle>Votre document</CardTitle>
                <CardDescription>Formats acceptés : PDF, DOCX</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Zone de dépôt */}
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  selectedFile
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 hover:border-green-400 hover:bg-green-50/30"
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="h-10 w-10 text-green-600 mx-auto" />
                    <p className="font-medium text-green-700">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
                    </p>
                    <p className="text-xs text-green-600 underline">Cliquer pour changer</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FileUp className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="font-medium text-gray-700">Glissez-déposez votre fichier ici</p>
                      <p className="text-sm text-muted-foreground mt-1">ou cliquez pour parcourir</p>
                    </div>
                    <p className="text-xs text-muted-foreground">PDF, DOCX — max 50 Mo</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="titre" className="text-base font-medium">
                  Titre du cours <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="titre"
                  placeholder="Ex : Algèbre Linéaire — Licence 2"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  disabled={isLoading}
                  className="text-base"
                />
                <p className="text-sm text-muted-foreground">
                  Sera utilisé comme titre du cours généré
                </p>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">📚 Ce qui se passe après l'upload</p>
                <ul className="space-y-0.5 text-blue-700">
                  <li>• Gemini analyse et découpe le document en granules</li>
                  <li>• La structure Partie → Chapitre → Section → Granule est créée</li>
                  <li>• Le cours apparaît dans votre tableau de bord en 30–120 s</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !selectedFile}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <FileUp className="mr-2 h-4 w-4" />
                      Importer le document
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
    </div>
  )
}
