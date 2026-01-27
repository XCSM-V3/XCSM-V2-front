"use client"

import type React from "react"

import { useEditor } from "@/contexts/editor-context"
import { useEffect, useRef } from "react"
import { toast } from "@/components/ui/use-toast"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { JSX } from "react/jsx-runtime"

export function EditorContent() {
  const { blocks, updateBlock, selectBlock, selectedBlockId, setIsModified, addBlock } = useEditor()
  const editorRef = useRef<HTMLDivElement>(null)

  // Gérer le glisser-déposer depuis la barre latérale
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.dataTransfer!.dropEffect = "copy"
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()

      try {
        const data = e.dataTransfer!.getData("application/json")
        if (!data) return

        const resource = JSON.parse(data)

        // Déterminer la position d'insertion en fonction de la position du curseur
        const insertAtIndex = getInsertPositionFromCursor(e)

        // Insérer la ressource à la position déterminée
        switch (resource.type) {
          case "image":
            // Stocker l'ID du bloc avant de l'ajouter
            const imageBlockId = generateId()

            // Ajouter le bloc avec l'ID prédéfini
            addBlock("image", insertAtIndex, imageBlockId)

            // Mettre à jour le bloc avec les données d'image
            updateBlock(imageBlockId, {
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
          case "quiz":
            // Même approche pour les autres types
            const blockId = generateId()
            addBlock("paragraph", insertAtIndex, blockId)

            updateBlock(blockId, {
              content: `<a href="${resource.url}" target="_blank">${resource.name}</a>`,
            })

            toast({
              title: `${resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} ajouté`,
              description: `Le ${resource.type} "${resource.name}" a été ajouté au document.`,
            })
            break
        }
      } catch (error) {
        console.error("Erreur lors du drop:", error)
      }
    }

    // Fonction utilitaire pour générer un ID unique
    const generateId = () => `block-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Déterminer la position d'insertion en fonction de la position du curseur
    const getInsertPositionFromCursor = (e: DragEvent): number => {
      if (!editorRef.current) return blocks.length

      const editorRect = editorRef.current.getBoundingClientRect()
      const mouseY = e.clientY - editorRect.top

      // Parcourir tous les blocs pour trouver celui qui est le plus proche du curseur
      const blockElements = editorRef.current.querySelectorAll("[data-block-id]")

      for (let i = 0; i < blockElements.length; i++) {
        const blockElement = blockElements[i] as HTMLElement
        const blockRect = blockElement.getBoundingClientRect()
        const blockMiddle = blockRect.top + blockRect.height / 2 - editorRect.top

        if (mouseY < blockMiddle) {
          return i
        }
      }

      return blocks.length
    }

    const editor = editorRef.current
    if (editor) {
      editor.addEventListener("dragover", handleDragOver)
      editor.addEventListener("drop", handleDrop)

      return () => {
        editor.removeEventListener("dragover", handleDragOver)
        editor.removeEventListener("drop", handleDrop)
      }
    }
  }, [blocks.length, addBlock, updateBlock])

  // Fonction pour rendre un bloc en fonction de son type
  const renderBlock = (block: any, index: number) => {
    const isSelected = selectedBlockId === block.id
    const blockStyles = {
      fontFamily: block.fontFamily || "Arial",
      fontSize: `${block.fontSize || 16}px`,
      fontWeight: block.isBold ? "bold" : "normal",
      fontStyle: block.isItalic ? "italic" : "normal",
      textDecoration: block.isUnderline ? "underline" : "none",
      textAlign: block.alignment || "left",
      color: block.textColor || "inherit",
      backgroundColor: block.bgColor === "transparent" ? "transparent" : block.bgColor || "transparent",
      padding: "8px",
      border: isSelected ? "2px solid #22c55e" : "2px solid transparent", // Changed to green
      borderRadius: "4px",
      margin: "4px 0",
      outline: "none",
    }

    const handleBlockClick = () => {
      selectBlock(block.id)
    }

    const handleBlockChange = (e: React.FocusEvent<any>) => {
      updateBlock(block.id, { content: e.currentTarget.innerText })
      setIsModified(true)
    }

    // Ajouter un attribut data-block-id pour le glisser-déposer
    // Remove key from blockProps and pass it directly to JSX elements
    const blockProps = {
      id: `block-${block.id}`,
      "data-block-id": block.id,
      "data-block-index": index,
      style: blockStyles,
      onClick: handleBlockClick,
      className: isSelected ? "ring-2 ring-green-200" : "", // Changed to green
    }

    switch (block.type) {
      case "heading":
        const HeadingTag = `h${block.level || 1}` as keyof JSX.IntrinsicElements
        return (
          <HeadingTag
            key={block.id}
            {...blockProps}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlockChange}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        )

      case "paragraph":
        return (
          <p
            key={block.id}
            {...blockProps}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlockChange}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        )

      case "list":
        const ListContainer = block.format === "ordered" ? "ol" : "ul"
        return (
          <div key={block.id} {...blockProps} style={{ ...blockStyles, padding: 0 }}>
            <ListContainer
              style={{ paddingLeft: "2rem" }}
              contentEditable
              suppressContentEditableWarning
              onBlur={handleBlockChange}
              dangerouslySetInnerHTML={{
                __html: block.content
                  .split("\n")
                  .map((item: string) => `<li>${item.replace(/^[•\d]+\.\s/, "")}</li>`)
                  .join(""),
              }}
            />
          </div>
        )

      case "image":
        return (
          <figure key={block.id} {...blockProps} style={{ ...blockStyles, textAlign: "center" }}>
            <img
              src={block.url || "/placeholder.svg?height=200&width=400"}
              alt={block.alt || "Image"}
              style={{ maxWidth: "100%", height: "auto" }}
            />
            {block.caption && (
              <figcaption
                style={{ marginTop: "8px", fontSize: "0.875rem", color: "#666" }}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlock(block.id, { caption: e.currentTarget.innerText })}
              >
                {block.caption}
              </figcaption>
            )}
          </figure>
        )

      case "table":
        return (
          <div
            key={block.id}
            {...blockProps}
            style={{ ...blockStyles, overflowX: "auto" }}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        )

      case "qcm":
        return (
          <div key={block.id} {...blockProps} style={{ ...blockStyles, padding: "12px" }}>
            <div className="border border-primary/20 rounded-md p-4 bg-muted/50">
              <h3 className="font-medium mb-2">QCM: {block.qcmData?.question || "Question à choix multiples"}</h3>
              <div className="text-sm text-muted-foreground mb-2">
                {block.qcmData?.type === "single" ? "Réponse unique" : "Réponses multiples"}
              </div>
              <div className="space-y-2">
                {block.qcmData?.options?.map((option: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    {block.qcmData.type === "single" ? (
                      <div className="h-4 w-4 rounded-full border border-gray-300 flex items-center justify-center">
                        {option.isCorrect && <div className="h-2 w-2 rounded-full bg-green-500" />}
                      </div>
                    ) : (
                      <div className="h-4 w-4 rounded-sm border border-gray-300 flex items-center justify-center">
                        {option.isCorrect && <Check className="h-3 w-3 text-green-500" />}
                      </div>
                    )}
                    <span>{option.text}</span>
                  </div>
                ))}
              </div>
              {block.qcmData?.explanation && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Explication:</span> {block.qcmData.explanation}
                  </p>
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Ouvrir le dialogue d'édition du QCM
                    // Dans une implémentation réelle, vous utiliseriez un état et un dialogue
                    alert("Édition du QCM - À implémenter")
                  }}
                >
                  Modifier
                </Button>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div key={block.id} {...blockProps} contentEditable suppressContentEditableWarning onBlur={handleBlockChange}>
            {block.content}
          </div>
        )
    }
  }

  return (
    <div className="flex-1 bg-muted/30 p-8 overflow-auto">
      <div ref={editorRef} className="max-w-4xl mx-auto bg-background shadow-lg rounded-lg p-8 min-h-[842px] border border-border">
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>
    </div>
  )
}
