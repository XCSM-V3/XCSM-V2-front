"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { EditorHeader } from "@/components/editor/editor-header"
import { EditorContent } from "@/components/editor/editor-content"
import { EditorSidebar } from "@/components/editor/editor-sidebar"
import { EditorToolbar } from "@/components/editor/editor-toolbar"
import { SidebarProvider } from "@/components/sidebar-provider"
import { EditorProvider } from "@/contexts/editor-context"
import { useToast } from "@/components/ui/use-toast"
import { getTemplateById } from "@/lib/templates"
import { SaveNotification } from "@/components/editor/save-notification"
import { api } from "@/lib/api"

// Helper component to bridge EditorPage state and EditorContext
const EditorManager = ({
  documentId,
  htmlContent,
  setHtmlContent
}: {
  documentId: string | null,
  htmlContent: string,
  setHtmlContent: (h: string) => void
}) => {
  const { registerSaveHandler, setIsModified, documentTitle, courseId, setCourseId } = useEditor()
  const { toast } = useToast()

  const [localDocumentId, setLocalDocumentId] = useState<string | null>(documentId)

  // Register the save handler that creates a course if needed and saves content
  useEffect(() => {
    registerSaveHandler(async () => {
      try {
        let currentCourseId = courseId
        let currentDocId = localDocumentId

        // 1. Creation du cours si inexistant
        if (!currentCourseId) {
          const newCourse = await api.createCourse({
            titre: documentTitle || "Document sans titre",
            description: "Cours créé depuis l'éditeur",
          })
          currentCourseId = newCourse.id
          setCourseId(currentCourseId)

          toast({
            title: "Cours créé",
            description: "Un nouveau cours a été créé pour votre document.",
          })
        }

        // 2. Création du document placeholder si inexistant
        if (!currentDocId) {
          // Créer un fichier texte simple pour éviter les erreurs de parsing PDF/HTML côté serveur
          const dummyFile = new File(["Placeholder content"], "cours_placeholder.txt", { type: "text/plain" })
          const newDoc = await api.uploadDocument(dummyFile, documentTitle || "Nouveau Document")

          currentDocId = newDoc.id
          setLocalDocumentId(currentDocId)

          // Mettre à jour l'URL sans recharger pour garder le contexte
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.set("id", currentDocId)
          newUrl.searchParams.delete("blank")
          window.history.pushState({}, "", newUrl.toString())
        }

        // 3. Sauvegarde du contenu (Structure)
        if (currentDocId) {
          // Si le contenu est vide, on envoie un paragraphe vide pour que le backend ne rejette pas la requête
          const htmlContentToSave = htmlContent && htmlContent.trim() !== "" ? htmlContent : "<p></p>"
          await api.updateDocumentStructure(currentDocId, htmlContentToSave, currentCourseId || undefined)

          // 4. IMPORTANT: Recharger la structure pour récupérer les IDs de granules (pour l'IA)
          try {
            const updatedDoc = await api.getDocumentJSON(currentDocId)

            // On reconstruit les blocks à partir de la réponse backend (qui contient les granule_id)
            if (updatedDoc.json_structure) {
              // Cette logique doit être similaire à celle dans loadInitialData dans EditorPage
              // Pour éviter la duplication, on pourrait extraire la logique de parsing, 
              // mais pour l'instant on fait un rechargement simple ici ou on signal au parent.
              // Le plus simple est de recharger la page silencieusement ou notifier l'utilisateur qu'il peut générer.

              // Option B: Nous n'avons pas accès facile à setInitialBlocks ici car c'est dans EditorPage.
              // Mais le contexte se met à jour si on recharge la page ou si on avait une méthode refresh.

              // Pour ce correctif rapide et robuste : on force un rechargement de la fenêtre après 500ms
              // Ou mieux : on utilise window.location.reload() pour être sûr.
              // C'est un peu brutale mais ça garantit que tout est synchro.
              // Une meilleure solution serait de mettre à jour le contexte, mais le mapping HTML -> Blocks est complexe ici.

              // Compromis : message toast explicite
              toast({
                title: "Synchronisé",
                description: "Structure mise à jour. Vous pouvez maintenant utiliser l'IA sur ces blocs.",
              })

              // Si on veut vraiment que ça marche sans reload, il faut parser updatedDoc
              // et appeler une méthode du contexte. Mais EditorManager n'a pas loadDocument complet.
              // On va laisser l'utilisateur recharger si besoin, ou on reload auto.
              setTimeout(() => {
                window.location.reload()
              }, 1000)
            }
          } catch (refreshError) {
            console.warn("Impossible de rafraîchir la structure après sauvegarde", refreshError)
          }
        }

        toast({
          title: "Sauvegardé",
          description: "Votre cours a été enregistré et synchronisé.",
        })

        return currentCourseId
      } catch (error) {
        console.error("Save error:", error)
        throw error
      }
    })
  }, [localDocumentId, htmlContent, registerSaveHandler, toast, courseId, setCourseId, documentTitle])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <EditorHeader />
      <div className="flex flex-1 overflow-hidden relative">
        <EditorSidebar />
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
          <div className="flex-1 overflow-hidden">
            <WordEditor
              initialContent={htmlContent}
              onContentChange={(newHtml) => {
                setHtmlContent(newHtml)
                setIsModified(true)
              }}
            />
          </div>
        </div>
      </div>
      <SaveNotification />
    </div>
  )
}

export default function EditorPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [initialBlocks, setInitialBlocks] = useState<any[]>([])
  const [initialTitle, setInitialTitle] = useState("Document sans titre")
  const [initialHtml, setInitialHtml] = useState("")

  // IDs
  const documentId = searchParams.get("id")

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const useTemplate = searchParams.get("template") === "true"
        const templateId = searchParams.get("templateId") || "default"
        const isImported = searchParams.get("imported") === "true"
        const isBlank = searchParams.get("blank") === "true"

        if (useTemplate) {
          const template = await getTemplateById(templateId)
          if (template) {
            setInitialBlocks(template.blocks || [])
            setInitialTitle(`Nouveau ${template.title}`)
          }
          toast({ title: "Modèle chargé", description: "Le modèle a été chargé avec succès." })

        } else if (isImported) {
          const parsedDocumentJson = localStorage.getItem("parsedDocument")
          if (parsedDocumentJson) {
            const parsedDocument = JSON.parse(parsedDocumentJson)
            setInitialTitle(parsedDocument.title || "Document importé")
            // Logic to set blocks (omitted for brevity, relying on backend fetch usually)
            // But for imported/local, we might need blocks.
            // For now, let's assume direct backend open is the primary flow we fixed.
          }
          toast({ title: "Document importé", description: "Le document a été importé avec succès." })

        } else if (documentId) {
          // Load from API with Polling
          const pollDocument = async (): Promise<any> => {
            let attempts = 0
            const maxAttempts = 30 // 60 seconds total (30 * 2s)

            while (attempts < maxAttempts) {
              const docData = await api.getDocumentJSON(documentId)

              // Si on a une structure JSON (même si le statut est ERREUR/EN_ATTENTE), on charge !
              if (docData.json_structure && Object.keys(docData.json_structure).length > 0) {
                return docData
              }

              if (docData.fichier_info?.statut_traitement === 'TRAITE') {
                return docData
              }

              if (docData.fichier_info?.statut_traitement === 'ERREUR') {
                // On accepte quand même si on a réussi à charger quelque chose, sinon erreur
                if (docData.json_structure) return docData
                throw new Error("Erreur lors du traitement du document par le serveur.")
              }

              // Still processing
              attempts++
              await new Promise(resolve => setTimeout(resolve, 2000))
            }

            throw new Error("Le traitement du document prend trop de temps. Veuillez réessayer plus tard.")
          }

          const docData = await pollDocument()

          setInitialTitle(docData.fichier_info?.titre || "Document importé")

          // Generate Blocks for Sidebar
          const blocks: any[] = []
          let blockCounter = 0
          const processNode = (node: any) => {
            if (!node) return
            const id = `block-${blockCounter++}`

            // Sidebar: Include Header levels for Granule Navigation
            if (['h1', 'h2', 'h3', 'h4'].includes(node.type)) {
              blocks.push({
                id,
                type: "heading",
                content: node.content,
                level: node.type === 'h1' ? 1 : node.type === 'h2' ? 2 : node.type === 'h3' ? 3 : 4,
                granule_id: node.granule_id // Use real PostgreSQL granule ID from backend
              })
            }
            // Also include standard paragraphs as 'Granules' if user wants granular view? 
            // For now, headers are best for navigation.

            if (node.children && Array.isArray(node.children)) {
              node.children.forEach(processNode)
            }
          }
          // Support nested structure_json from MongoDB if present
          const actualStructure = docData.json_structure?.structure_json || docData.json_structure

          if (actualStructure && actualStructure.sections) {
            actualStructure.sections.forEach(processNode)
          }
          setInitialBlocks(blocks)

          // Generate HTML for Editor (Initial Load)
          const reconstructHtml = (nodes: any[]): string => {
            if (!nodes) return ""
            return nodes.map(node => {
              let html = node.html || `<p>${node.content}</p>`

              let childrenHtml = ""
              if (node.children && node.children.length > 0) {
                childrenHtml = reconstructHtml(node.children)
              }

              return `${html}\n${childrenHtml}`
            }).join('\n')
          }

          if (actualStructure && actualStructure.sections) {
            setInitialHtml(reconstructHtml(actualStructure.sections))
          } else {
            setInitialHtml('<p>Document vide ou structure non reconnue.</p>')
          }

          toast({ title: "Document chargé", description: "Le document a été chargé avec succès." })
        } else if (isBlank) {
          setInitialTitle("Nouveau document")
          setInitialBlocks([])
          setInitialHtml('<p>Commencez à écrire ici...</p>')
        }

        setIsLoading(false)
      } catch (error) {
        console.error(error)
        setIsLoading(false)
        toast({ title: "Erreur", description: "Erreur de chargement.", variant: "destructive" })
      }
    }

    loadInitialData()
  }, [searchParams, toast, documentId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <EditorProvider initialBlocks={initialBlocks} initialTitle={initialTitle}>
      <SidebarProvider>
        <EditorManager
          documentId={documentId}
          htmlContent={initialHtml}
          setHtmlContent={setInitialHtml}
        />
      </SidebarProvider>
    </EditorProvider>
  )
}

import { WordEditor } from "@/components/editor/word-editor"
import { useEditor } from "@/contexts/editor-context" // Ensure this hook is exported
