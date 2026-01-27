"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FileUp, FileText, PlusCircle } from "lucide-react"

export function CreateCourseOptions() {
  const router = useRouter()

  const handleImportDocument = () => {
    router.push("/importer-document")
  }

  const handleUseTemplate = () => {
    router.push("/dashboard/editeur?template=true")
  }

  const handleBlankPage = () => {
    router.push("/dashboard/editeur?blank=true")
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card
        className="p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer border-green-100"
        onClick={handleImportDocument}
      >
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <FileUp className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Importer un document</h3>
        <p className="text-gray-500 mb-4">Importez un document existant et convertissez-le en cours interactif</p>
        <Button className="mt-auto w-full bg-green-600 hover:bg-green-700">Importer</Button>
      </Card>

      <Card
        className="p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer border-green-100"
        onClick={handleUseTemplate}
      >
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">À partir d'un template</h3>
        <p className="text-gray-500 mb-4">Utilisez un modèle prédéfini pour créer rapidement votre cours</p>
        <Button className="mt-auto w-full bg-green-600 hover:bg-green-700">Choisir un template</Button>
      </Card>

      <Card
        className="p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer border-green-100"
        onClick={handleBlankPage}
      >
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <PlusCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Page vierge</h3>
        <p className="text-gray-500 mb-4">Commencez avec une page vierge et créez votre cours de zéro</p>
        <Button className="mt-auto w-full bg-green-600 hover:bg-green-700">Créer</Button>
      </Card>
    </div>
  )
}
