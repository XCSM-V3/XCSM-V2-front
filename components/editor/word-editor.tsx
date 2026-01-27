"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Highlight from "@tiptap/extension-highlight"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { useEffect, useState, useMemo } from "react"
import { useEditor as useEditorContext } from "@/contexts/editor-context"
import { Button } from "@/components/ui/button"
import {
    Bold, Italic, Underline as UnderlineIcon,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Undo, Redo, FileDown,
    Highlighter
} from "lucide-react"

// Import for export functionality
// Note: We'll dynamic import these to avoid SSR issues
import { jsPDF } from "jspdf"
// import * as htmlDocx from "html-docx-js-typescript"


export function WordEditor({
    initialContent,
    onLoad,
    onContentChange
}: {
    initialContent?: string,
    onLoad?: (editor: any) => void,
    onContentChange?: (html: string) => void
}) {
    // Configuration des extensions Tiptap pour éviter les re-créations et doublons
    const extensions = useMemo(() => [
        StarterKit.configure({
            heading: {
                levels: [1, 2, 3],
                HTMLAttributes: {
                    // Les IDs seront générés automatiquement ou via un plugin, 
                    // mais pour la navigation simple, Tiptap ne met pas d'ID par défaut.
                    // On peut faire une extension custom mais restons simples.
                },
            },
            // StarterKit inclut déjà : Blockquote, BulletList, CodeBlock, Document, HardBreak, 
            // Heading, History, HorizontalRule, ListItem, OrderedList, Paragraph, Text
        }),
        Underline,
        Image.configure({
            inline: true,
            allowBase64: true,
        }),
        Link.configure({
            openOnClick: false,
            autolink: true,
            defaultProtocol: 'https',
        }),
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        Highlight,
    ], [])

    const editor = useEditor({
        extensions: extensions,
        content: initialContent || '<p>Commencez à rédiger votre document...</p>',
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl dark:prose-invert m-5 focus:outline-none min-h-[500px] p-10 bg-background shadow-lg mx-auto border border-border outline-none max-w-[21cm]',
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.getData("application/json")) {
                    try {
                        const data = JSON.parse(event.dataTransfer.getData("application/json"))
                        const { schema } = view.state
                        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })

                        // Si le drop est en dehors, on ne fait rien (ou on append à la fin)
                        if (!coordinates) return false

                        let transaction = view.state.tr

                        if (data.type === 'image') {
                            const node = schema.nodes.image.create({ src: data.url, alt: data.name })
                            transaction.insert(coordinates.pos, node)
                        } else {
                            // Pour les autres types, on insère un lien
                            const text = data.name
                            const mark = schema.marks.link.create({ href: data.url })
                            const node = schema.text(text, [mark])
                            transaction.insert(coordinates.pos, node)
                        }

                        view.dispatch(transaction)
                        return true // Handled
                    } catch (e) {
                        console.error("Drop error", e)
                        return false
                    }
                }
                return false
            }
        },
        onUpdate: ({ editor }) => {
            if (onContentChange) {
                onContentChange(editor.getHTML())
            }
        }
    })

    useEffect(() => {
        if (editor && initialContent && initialContent !== editor.getHTML()) {
            // We only set content if it's significantly different to avoid cursor jumps
            // In the case of initial load, it will be blank -> full content.
            // Check if emptiness matches to avoid clearing user input
            if (editor.isEmpty && initialContent === '<p>Commencez à rédiger votre document...</p>') return;

            editor.commands.setContent(initialContent)
        }
    }, [editor, initialContent])

    useEffect(() => {
        if (editor && onLoad) {
            onLoad(editor)
        }
    }, [editor, onLoad])

    const { registerExportHandler } = useEditorContext()

    const exportToPDF = () => {
        if (!editor) return
        const content = editor.getHTML()
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(`
            <html>
            <head>
                <title>Export PDF</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    .prose { max-width: 100%; }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `)
            printWindow.document.close()
            setTimeout(() => {
                printWindow.print()
            }, 500)
        }
    }

    const exportToWord = async () => {
        if (!editor) return
        const content = `
      <!DOCTYPE html>
      <html>
      <head>
      <meta charset="utf-8">
      </head>
      <body>
        ${editor.getHTML()}
      </body>
      </html>
    `
        const { asBlob } = await import("html-docx-js-typescript")
        const blob = await asBlob(content)
        const url = URL.createObjectURL(blob as Blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "document.docx"
        link.click()
    }

    // Register handlers
    useEffect(() => {
        if (editor) {
            registerExportHandler("pdf", exportToPDF)
            registerExportHandler("word", exportToWord)
        }
    }, [editor, registerExportHandler])

    if (!editor) {
        return null
    }

    return (
        <div className="flex flex-col h-full bg-muted/30">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 border-b border-border bg-background flex-wrap sticky top-0 z-10 shadow-sm">
                <div className="flex items-center border-r pr-2 mr-2 gap-1">
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-primary/20 text-primary' : ''}>
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-primary/20 text-primary' : ''}>
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'bg-primary/20 text-primary' : ''}>
                        <UnderlineIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? 'bg-primary/20 text-primary' : ''}>
                        <Highlighter className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center border-r pr-2 mr-2 gap-1">
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'bg-primary/20 text-primary' : ''}>
                        <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'bg-primary/20 text-primary' : ''}>
                        <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'bg-primary/20 text-primary' : ''}>
                        <AlignRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'bg-primary/20 text-primary' : ''}>
                        <AlignJustify className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center border-r pr-2 mr-2 gap-1">
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-primary/20 text-primary' : ''}>
                        <List className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-primary/20 text-primary' : ''}>
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-1 ml-auto">
                    <Button variant="outline" size="sm" onClick={exportToWord} className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                        <FileDown className="h-4 w-4" />
                        DOCX
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
                        <FileDown className="h-4 w-4" />
                        PDF (Print)
                    </Button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-muted/30 flex justify-center">
                <EditorContent editor={editor} className="w-full max-w-[21cm]" />
            </div>
        </div>
    )
}
