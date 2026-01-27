"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from "react"

// Types pour les blocs d'éditeur
export type BlockType = "paragraph" | "heading" | "list" | "image" | "qcm" | "code" | "quote" | "table"

export type EditorBlock = {
  id: string
  type: BlockType
  content: string
  level?: number // Pour les titres
  items?: string[] // Pour les listes
  src?: string // Pour les images
  alt?: string // Pour les images
  caption?: string // Pour les images
  language?: string // Pour le code
  options?: { id: string; text: string; isCorrect: boolean }[] // Pour les QCM
  explanation?: string // Pour les QCM
  fontFamily?: string
  fontSize?: string
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  alignment?: "left" | "center" | "right" | "justify"
  textColor?: string
  bgColor?: string
  rows?: number
  cols?: number
  qcmData?: any
  url?: string
  format?: string
  thumbnail?: string
  video_id?: string
  granule_id?: string // Lien vers le granule backend pour l'IA
}

type EditorContextType = {
  blocks: EditorBlock[]
  documentTitle: string
  setDocumentTitle: (title: string) => void
  addBlock: (type: BlockType, index: number, id?: string) => void
  updateBlock: (id: string, data: Partial<EditorBlock>) => void
  deleteBlock: (id: string) => void
  moveBlockUp: (id: string) => void
  moveBlockDown: (id: string) => void
  selectBlock: (id: string) => void
  selectedBlockId: string | null
  isModified: boolean
  setIsModified: (modified: boolean) => void
  saveDocument: () => Promise<string | undefined>
  createNewDocument: () => void
  loadDocument: (data: any) => void
  registerSaveHandler: (handler: () => Promise<string | undefined>) => void
  registerExportHandler: (type: "pdf" | "word", handler: () => void) => void
  exportDocument: (type: "pdf" | "word") => void
  courseId: string | null
  setCourseId: (id: string | null) => void
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

type EditorProviderProps = {
  children: React.ReactNode
  initialBlocks?: EditorBlock[]
  initialTitle?: string
}

export const EditorProvider = ({ children, initialBlocks = [], initialTitle = "Document sans titre" }: EditorProviderProps) => {
  const [blocks, setBlocks] = useState<EditorBlock[]>(initialBlocks)
  const [documentTitle, setDocumentTitle] = useState(initialTitle)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [isModified, setIsModified] = useState(false)
  const [courseId, setCourseId] = useState<string | null>(null)

  // Générer un ID unique pour un bloc
  const generateId = () => `block-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  // Ajouter un nouveau bloc
  const addBlock = (type: BlockType, index: number, id?: string) => {
    const newBlock: EditorBlock = {
      id: id || generateId(),
      type,
      content: "",
    }

    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks]
      newBlocks.splice(index, 0, newBlock)
      return newBlocks
    })

    setIsModified(true)
  }

  // Mettre à jour un bloc
  const updateBlock = (id: string, data: Partial<EditorBlock>) => {
    setBlocks((prevBlocks) => prevBlocks.map((block) => (block.id === id ? { ...block, ...data } : block)))
    setIsModified(true)
  }

  // Supprimer un bloc
  const deleteBlock = (id: string) => {
    setBlocks((prevBlocks) => prevBlocks.filter((block) => block.id !== id))
    setIsModified(true)
  }

  // Déplacer un bloc vers le haut
  const moveBlockUp = (id: string) => {
    const index = blocks.findIndex((block) => block.id === id)
    if (index <= 0) return

    const newBlocks = [...blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[index - 1]
    newBlocks[index - 1] = temp
    setBlocks(newBlocks)
    setIsModified(true)
  }

  // Déplacer un bloc vers le bas
  const moveBlockDown = (id: string) => {
    const index = blocks.findIndex((block) => block.id === id)
    if (index >= blocks.length - 1) return

    const newBlocks = [...blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[index + 1]
    newBlocks[index + 1] = temp
    setBlocks(newBlocks)
    setIsModified(true)
  }

  // Sélectionner un bloc
  const selectBlock = (id: string) => {
    setSelectedBlockId(id)
  }

  const [saveHandler, setSaveHandler] = useState<(() => Promise<string | undefined>) | null>(null)

  // Memoize registerSaveHandler to avoid infinite loops in effects
  const registerSaveHandler = useCallback((handler: () => Promise<string | undefined>) => {
    setSaveHandler(() => handler)
  }, [])

  // Gestionnaires d'exportation
  const [exportHandlers, setExportHandlers] = useState<{ pdf: (() => void) | null; word: (() => void) | null }>({
    pdf: null,
    word: null,
  })

  const registerExportHandler = useCallback((type: "pdf" | "word", handler: () => void) => {
    setExportHandlers((prev) => ({ ...prev, [type]: handler }))
  }, [])

  const exportDocument = useCallback((type: "pdf" | "word") => {
    const handler = exportHandlers[type]
    if (handler) {
      handler()
    } else {
      console.warn(`No export handler registered for ${type}`)
    }
  }, [exportHandlers])

  // Sauvegarder le document
  const saveDocument = useCallback(async (): Promise<string | undefined> => {
    if (saveHandler) {
      try {
        const result = await saveHandler()
        setIsModified(false)
        return result
      } catch (e) {
        console.error("Save failed", e)
        throw e
      }
    }
    // Fallback simulation
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsModified(false)
    return "doc-123"
  }, [saveHandler])

  // Créer un nouveau document
  const createNewDocument = useCallback(() => {
    setBlocks([])
    setDocumentTitle("Document sans titre")
    setSelectedBlockId(null)
    setIsModified(false)
    setCourseId(null)
  }, [])

  // Charger un document
  const loadDocument = useCallback((data: any) => {
    setBlocks(data.blocks)
    setDocumentTitle(data.title)
    setSelectedBlockId(null)
    setIsModified(false)
  }, [])

  const contextValue = useMemo(() => ({
    blocks,
    documentTitle,
    setDocumentTitle,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlockUp,
    moveBlockDown,
    selectBlock,
    selectedBlockId,
    isModified,
    setIsModified,
    saveDocument,
    createNewDocument,
    registerSaveHandler,
    registerExportHandler,
    exportDocument,
    loadDocument,
    courseId,
    setCourseId,
  }), [
    blocks, documentTitle, selectedBlockId, isModified, saveDocument,
    createNewDocument, registerSaveHandler, registerExportHandler, exportDocument, loadDocument, courseId
  ])

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  )
}

export const useEditor = () => {
  const context = useContext(EditorContext)
  if (context === undefined) {
    throw new Error("useEditor must be used within an EditorProvider")
  }
  return context
}
