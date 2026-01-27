"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Edit } from "lucide-react"


export default function PreviewPage() {
  const router = useRouter()
  const [document, setDocument] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Récupérer le document parsé depuis le localStorage
    const parsedDocumentJson = localStorage.getItem("parsedDocument")

    if (parsedDocumentJson) {
      const parsedDocument = JSON.parse(parsedDocumentJson)
      setDocument(parsedDocument)
    }

    setIsLoading(false)
  }, [])

  const handleEdit = () => {
    router.push("/dashboard/editeur?imported=true")
  }

  const handleBack = () => {
    router.push("/apercu-document")
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        <p className="mt-4 text-lg">Chargement de la prévisualisation...</p>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-3xl mx-auto p-6 text-center border-green-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
            <p className="mb-6">Aucun document n'a été importé ou une erreur s'est produite.</p>
            <Button onClick={() => router.push("/importer-document")} className="bg-green-600 hover:bg-green-700">
              Réessayer
            </Button>
          </Card>
        </div>
      </div>
    )
  }



  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center border-green-200 hover:bg-green-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'aperçu
            </Button>
            <Button onClick={handleEdit} className="flex items-center bg-green-600 hover:bg-green-700">
              <Edit className="mr-2 h-4 w-4" />
              Éditer
            </Button>
          </div>

          <Card className="p-8 mb-8 border-green-100">
            <h1 className="text-3xl font-bold mb-6">{document.title || "Document sans titre"}</h1>

            <div className="prose max-w-none">
              {document.chapters &&
                document.chapters.map((chapter: any, index: number) => (
                  <div key={index} className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">{chapter.title}</h2>
                    <div className="text-gray-700 whitespace-pre-line">{chapter.content}</div>


                  </div>
                ))}

              {(!document.chapters || document.chapters.length === 0) && (
                <p className="text-gray-500 italic">Aucun contenu disponible pour la prévisualisation.</p>
              )}
            </div>
          </Card>

          <div className="flex justify-center">
            <Button onClick={handleEdit} className="bg-green-600 hover:bg-green-700">
              Éditer ce document
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
