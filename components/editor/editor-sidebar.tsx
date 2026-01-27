"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Search,
  FileText,
  ImageIcon,
  Video,

  Plus,
  Heading1,
  Heading2,
  Heading3,
  PenLineIcon as ParagraphIcon,
  ListIcon,
  TableIcon,
  Upload,
} from "lucide-react"
import { useEditor } from "@/contexts/editor-context"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


export function EditorSidebar() {
  const { blocks, addBlock, updateBlock, selectBlock, selectedBlockId, courseId, saveDocument } = useEditor()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [documentStructure, setDocumentStructure] = useState<any[]>([])

  // State for fetched resources
  const [resources, setResources] = useState<any>({
    documents: [],
    images: [],
    videos: [],
    quizzes: [],
  })

  // Filtered resources state
  const [filteredResources, setFilteredResources] = useState<any>({
    documents: [],
    images: [],
    videos: [],
    quizzes: [],
  })

  const [selectedGranule, setSelectedGranule] = useState<{ id: string, title: string } | null>(null)

  // Load resources from API
  useEffect(() => {
    // Ne rien faire si courseId n'existe pas (éditeur vide)
    if (!courseId) {
      console.log("EditorSidebar: Pas de courseId, skip loading resources")
      return
    }

    const loadResources = async () => {
      try {
        console.log("EditorSidebar: Loading resources for course", courseId)
        // Import api here to avoid circular dependencies if any, or use the global one
        const { api } = await import('@/lib/api')
        const data = await api.getResources(courseId)

        // Transform API data to component format
        const newResources = {
          documents: [],
          images: [],

        } as any

        data.forEach((item: any) => {
          const mappedItem = {
            id: item.id,
            name: item.titre,
            url: item.fichier_url,
            type: item.type_ressource.toLowerCase(), // 'image', 'video'
            thumbnail: item.fichier_url // Use same URL for thumbnail for now
          }

          if (mappedItem.type === 'image') {
            newResources.images.push(mappedItem)
          } else if (mappedItem.type === 'video') {
            newResources.videos.push(mappedItem)
          } else {
            // Default to document for others
            mappedItem.type = 'document'
            newResources.documents.push(mappedItem)
          }
        })

        setResources(newResources)
        setFilteredResources(newResources) // Initialize filtered with all
        console.log("EditorSidebar: Resources loaded successfully", newResources)
      } catch (error) {
        console.error("Failed to load resources:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les ressources du cours.",
          variant: "destructive"
        })
      }
    }

    loadResources()
  }, [courseId])

  const dragItemRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    console.log("=== UPLOAD START ===")

    if (!file) return

    let targetCourseId = courseId

    // Si pas de cours, on sauvegarde d'abord pour le créer
    if (!targetCourseId) {
      const shouldSave = confirm("Le document doit être sauvegardé pour ajouter des ressources. Sauvegarder maintenant ?")
      if (!shouldSave) {
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      try {
        toast({ title: "Sauvegarde en cours...", description: "Création du cours..." })
        const savedId = await saveDocument()

        if (savedId) {
          targetCourseId = savedId
          console.log("Course created/saved with ID:", targetCourseId)
        } else {
          throw new Error("Impossible de récupérer l'ID du cours après sauvegarde")
        }
      } catch (err) {
        console.error("Auto-save failed:", err)
        toast({
          title: "Erreur",
          description: "Erreur lors de la sauvegarde. Veuillez sauvegarder manuellement.",
          variant: "destructive"
        })
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
    }

    if (!targetCourseId) {
      toast({ title: "Erreur", description: "ID du cours manquant.", variant: "destructive" })
      return
    }

    try {
      const { api } = await import('@/lib/api')

      toast({
        title: "Upload en cours...",
        description: `Upload de ${file.name}`,
      })

      const newResource = await api.uploadResource(targetCourseId, file)

      console.log("Upload successful:", newResource)

      // Ensure we have a valid URL or fallback
      const resourceUrl = newResource.fichier_url || newResource.fichier || ""

      if (!resourceUrl) {
        console.warn("Uploaded resource has no URL:", newResource)
      }

      const mappedResource = {
        id: newResource.id || `res-${Date.now()}`,
        name: newResource.titre || file.name,
        url: resourceUrl,
        type: 'image',
        thumbnail: resourceUrl // Safe to use potentially empty string, img will handle or error gracefully
      }

      setResources((prev: any) => {
        const updated = {
          ...prev,
          images: [mappedResource, ...prev.images]
        }
        setFilteredResources((prevFiltered: any) => ({
          ...prevFiltered,
          images: [mappedResource, ...prevFiltered.images]
        }))
        return updated
      })

      toast({
        title: "Succès",
        description: "Image ajoutée aux ressources",
      })



    } catch (err: any) {
      console.error("=== UPLOAD ERROR ===")
      console.error(err)

      let message = "Échec de l'upload"
      if (err.message) {
        if (err.message.includes("413")) message = "Fichier trop volumineux (Max 50MB)";
        else if (err.message.includes("500")) message = "Erreur serveur interne";
        else message = err.message;
      }

      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      })
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }


  // Générer la structure du document à partir des blocs
  useEffect(() => {
    const structure: any[] = []
    let currentSection: any = null
    let currentSubsection: any = null

    blocks.forEach((block, index) => {
      if (block.type === "heading") {
        const level = block.level || 1

        if (level === 1) {
          // Titre principal
          currentSection = {
            id: block.id,
            title: block.content,
            level: 1,
            children: [],
            granule_id: block.granule_id
          }
          structure.push(currentSection)
          currentSubsection = null
        } else if (level === 2 && currentSection) {
          // Sous-titre
          currentSubsection = {
            id: block.id,
            title: block.content,
            level: 2,
            children: [],
            granule_id: block.granule_id
          }
          currentSection.children.push(currentSubsection)
        } else if (level === 3 && currentSubsection) {
          // Sous-sous-titre
          currentSubsection.children.push({
            id: block.id,
            title: block.content,
            level: 3,
            granule_id: block.granule_id
          })
        }
      }
    })

    setDocumentStructure(structure)
  }, [blocks])

  // Filtrer les ressources en fonction de la recherche
  useEffect(() => {
    if (!searchQuery) {
      setFilteredResources(resources)
    }

    const query = searchQuery.toLowerCase()
    const filtered = {
      documents: resources.documents.filter((doc: any) => doc.name.toLowerCase().includes(query)),
      images: resources.images.filter((img: any) => img.name.toLowerCase().includes(query)),
      videos: resources.videos.filter((vid: any) => vid.name.toLowerCase().includes(query)),

    }

    setFilteredResources(filtered)
  }, [searchQuery, resources]) // Added resources to dependency array

  // Naviguer vers un bloc spécifique
  const navigateToBlock = (blockId: string) => {
    selectBlock(blockId)

    // Faire défiler jusqu'au bloc sélectionné
    const blockElement = document.getElementById(`block-${blockId}`)
    if (blockElement) {
      blockElement.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }



  // Ajouter une ressource à l'éditeur
  const addResourceToEditor = (resource: any) => {
    const selectedIndex = blocks.findIndex((block) => block.id === selectedBlockId)
    const insertIndex = selectedIndex !== -1 ? selectedIndex + 1 : blocks.length

    // Générer un ID unique pour le nouveau bloc
    const newBlockId = `block-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    switch (resource.type) {
      case "image":
        // Ajouter un bloc d'image avec l'ID prédéfini
        addBlock("image", insertIndex, newBlockId)

        // Mettre à jour le bloc avec les données d'image
        updateBlock(newBlockId, {
          type: "image",
          url: resource.url,
          alt: resource.name,
          caption: resource.name,
        })

        toast({
          title: "Image ajoutée",
          description: `L'image "${resource.name}" a été ajoutée au document.`,
        })
        break

      case "video":
      case "document":
        // Ajouter un bloc de paragraphe avec l'ID prédéfini
        addBlock("paragraph", insertIndex, newBlockId)

        // Mettre à jour le bloc avec un lien
        updateBlock(newBlockId, {
          content: `<a href="${resource.url}" target="_blank">${resource.name}</a>`,
        })

        toast({
          title: "Document ajouté",
          description: `Le document "${resource.name}" a été ajouté au document.`,
        })
        break
    }
  }

  // Gérer le glisser-déposer
  const handleDragStart = (e: React.DragEvent, resource: any) => {
    e.dataTransfer.setData("application/json", JSON.stringify(resource))
    e.dataTransfer.effectAllowed = "copy"

    // Ajouter une image fantôme pour le glisser-déposer
    if (dragItemRef.current) {
      e.dataTransfer.setDragImage(dragItemRef.current, 20, 20)
    }
  }

  // Ajouter un nouveau bloc de structure
  const addStructureBlock = (type: string, level = 1) => {
    const selectedIndex = blocks.findIndex((block) => block.id === selectedBlockId)
    const insertIndex = selectedIndex !== -1 ? selectedIndex + 1 : blocks.length

    switch (type) {
      case "heading":
        addBlock("heading", insertIndex)
        setTimeout(() => {
          const newBlockId = blocks[insertIndex]?.id
          if (newBlockId) {
            updateBlock(newBlockId, {
              level: level,
              content: `Nouveau titre niveau ${level}`,
            } as any)
          }
        }, 0)
        break

      case "paragraph":
        addBlock("paragraph", insertIndex)
        break

      case "list":
        addBlock("list", insertIndex)
        setTimeout(() => {
          const newBlockId = blocks[insertIndex]?.id
          if (newBlockId) {
            updateBlock(newBlockId, {
              format: "unordered",
              content: "• Élément de liste\n• Élément de liste\n• Élément de liste",
            } as any)
          }
        }, 0)
        break

      case "table":
        addBlock("table", insertIndex)
        setTimeout(() => {
          const newBlockId = blocks[insertIndex]?.id
          if (newBlockId) {
            updateBlock(newBlockId, {
              content: `<table style="width:100%; border-collapse: collapse;">
                <tr>
                  <td style="border: 1px solid #ccc; padding: 8px;">Cellule</td>
                  <td style="border: 1px solid #ccc; padding: 8px;">Cellule</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ccc; padding: 8px;">Cellule</td>
                  <td style="border: 1px solid #ccc; padding: 8px;">Cellule</td>
                </tr>
              </table>`,
              rows: 2,
              cols: 2,
            } as any)
          }
        }, 0)
        break
    }
  }

  // Rendu récursif de la structure du document
  const renderStructureItem = (item: any, depth = 0) => {
    return (
      <div key={item.id} className="mb-1">
        <Button
          variant="ghost"
          className={`w-full justify-start gap-2 pl-${depth * 4 + 2} text-sm ${selectedBlockId === item.id ? "bg-primary/10 text-primary" : ""}`}
          onClick={() => navigateToBlock(item.id)}
        >
          {item.level === 1 ? (
            <Heading1 className="h-4 w-4" />
          ) : item.level === 2 ? (
            <Heading2 className="h-4 w-4" />
          ) : (
            <Heading3 className="h-4 w-4" />
          )}
          <span className="truncate">{item.title}</span>
        </Button>


      </div>
    )
  }

  // Rendu d'une ressource avec bouton d'ajout
  const renderResource = (resource: any) => {
    const Icon =
      resource.type === "document"
        ? FileText
        : resource.type === "image"
          ? ImageIcon
          : resource.type === "video"
            ? Video
            : FileText


    return (
      <div
        key={resource.id}
        className="flex items-center group relative w-full rounded-md hover:bg-muted transition-colors cursor-pointer"
        draggable
        onDragStart={(e) => handleDragStart(e, resource)}
        onClick={() => addResourceToEditor(resource)}
      >
        <div className="flex items-center gap-2 text-sm px-3 py-2 w-full pr-10">
          <Icon className="h-4 w-4" />
          <span className="truncate">{resource.name}</span>
        </div>

        <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    addResourceToEditor(resource)
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ajouter au document</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 border-r border-border bg-background h-full overflow-hidden flex flex-col">
      <Tabs defaultValue="structure" className="flex flex-col h-full">
        <TabsList className="w-full">
          <TabsTrigger value="structure" className="flex-1">
            Structure
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex-1">
            Ressources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="p-0 flex-1 overflow-hidden flex flex-col">
          <div className="p-3 flex-1 overflow-hidden flex flex-col">
            <div className="relative mb-4">
              <div className="flex items-center gap-1 mb-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => addStructureBlock("heading", 1)}
                      >
                        <Heading1 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ajouter un titre</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => addStructureBlock("heading", 2)}
                      >
                        <Heading2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ajouter un sous-titre</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => addStructureBlock("paragraph")}
                      >
                        <ParagraphIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ajouter un paragraphe</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => addStructureBlock("list")}
                      >
                        <ListIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ajouter une liste</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => addStructureBlock("table")}
                      >
                        <TableIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ajouter un tableau</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Search className="absolute left-2 top-[calc(2.5rem+2px)] h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-1">
                {documentStructure.length > 0 ? (
                  documentStructure.map((item) => renderStructureItem(item))
                ) : (
                  <div className="text-sm text-muted-foreground p-2 text-center">
                    Aucune structure détectée. Ajoutez des titres à votre document.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="p-0 flex-1 overflow-hidden flex flex-col">
          <div className="p-3 flex-1 overflow-hidden flex flex-col">
            <div className="relative mb-4">
              <div className="flex gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex gap-2 items-center justify-center border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Importer une image
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {filteredResources.documents?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Documents</h3>
                    <div className="space-y-1">{filteredResources.documents.map((doc: any) => renderResource(doc))}</div>
                  </div>
                )}

                {filteredResources.images?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Images</h3>
                    <div className="space-y-1">{filteredResources.images.map((img: any) => renderResource(img))}</div>
                  </div>
                )}

                {filteredResources.videos?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Vidéos</h3>
                    <div className="space-y-1">{filteredResources.videos.map((vid: any) => renderResource(vid))}</div>
                  </div>
                )}


              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>

      {/* Élément invisible pour le glisser-déposer */}
      <div
        ref={dragItemRef}
        className="fixed -left-full -top-full w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center border border-blue-300"
      >
        <Plus className="h-4 w-4 text-blue-600" />
      </div>


    </div>
  )
}
