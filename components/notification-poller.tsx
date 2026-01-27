"use client"

import { useEffect, useRef } from "react"
import { api, Document } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

export function NotificationPoller() {
    const { toast } = useToast()
    const { isAuthenticated } = useAuth()
    const pendingDocsRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        if (!isAuthenticated) return

        const checkStatus = async () => {
            try {
                const documents = await api.getDocuments()

                // Identifier les documents en attente
                const currentPendingIds = new Set<string>()
                const processedIds = new Set<string>()

                documents.forEach((doc) => {
                    if (doc.statut_traitement === "EN_ATTENTE") {
                        currentPendingIds.add(doc.id)
                        // Ajouter aux suivis si pas déjà présent
                        if (!pendingDocsRef.current.has(doc.id)) {
                            pendingDocsRef.current.add(doc.id)
                            console.log(`[Poller] Suivi du document: ${doc.titre}`)
                        }
                    } else if (pendingDocsRef.current.has(doc.id)) {
                        // C'était en attente, maintenant ce n'est plus le cas
                        if (doc.statut_traitement === "TRAITE") {
                            processedIds.add(doc.id)

                            // NOTIFICATION !
                            toast({
                                title: "Découpage Terminé ✅",
                                description: `Le document "${doc.titre}" a été analysé et découpé avec succès.`,
                                className: "bg-green-50 border-green-200 text-green-900",
                            })

                            // Retirer du suivi
                            pendingDocsRef.current.delete(doc.id)
                        } else if (doc.statut_traitement === "ERREUR") {
                            toast({
                                title: "Échec du Découpage ❌",
                                description: `Erreur lors du traitement de "${doc.titre}".`,
                                variant: "destructive",
                            })
                            pendingDocsRef.current.delete(doc.id)
                        }
                    }
                })

            } catch (error) {
                console.warn("Erreur polling notifications (silencieux):", error)
            }
        }

        // Premier check immédiat
        checkStatus()

        // Polling toutes les 5 secondes
        const interval = setInterval(checkStatus, 5000)

        return () => clearInterval(interval)
    }, [isAuthenticated, toast])

    return null // Composant invisible (logique uniquement)
}
