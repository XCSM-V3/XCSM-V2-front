"use client"

import { useState, useEffect, useCallback } from "react"
import { api, type User, type Course, type Document } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

// ============================================================================
// AUTH HOOK - ADAPTÉ POUR DJANGO BACKEND
// ============================================================================

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const logout = useCallback(() => {
    console.log("Exécution de logout...")
    api.logout()
    setUser(null)
    setIsAuthenticated(false)

    if (typeof window !== "undefined") {
      // Nettoyage forcé au cas où
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
      localStorage.removeItem("userRole")

      // Éviter la boucle si on est déjà sur login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }

    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès.",
    })
  }, [toast])

  useEffect(() => {
    const checkAuth = async () => {
      // Vérifier d'abord s'il y a un token
      const hasToken = typeof window !== 'undefined' && localStorage.getItem('access_token')

      if (hasToken) {
        try {
          const userData = await api.getCurrentUser()
          setUser(userData)
          setIsAuthenticated(true)
        } catch (error) {
          // Token invalide ou expiré, nettoyer et déconnecter
          console.warn("Token invalide lors du checkAuth, déconnexion")
          logout()
        }
      } else {
        // Pas de token, simplement charger l'état déconnecté
        setIsAuthenticated(false)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [logout])

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true)
      try {
        const userData = await api.login(email, password)
        setUser(userData)
        setIsAuthenticated(true)

        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${userData.prenom} ${userData.nom}!`,
        })

        return userData
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur de connexion"
        toast({
          title: "Erreur de connexion",
          description: message,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const register = useCallback(
    async (userData: {
      email: string
      nom: string
      prenom: string
      password: string
      password2: string
      role: "enseignant" | "etudiant"
    }) => {
      setIsLoading(true)
      try {
        const result = await api.register(userData)
        setUser(result)
        setIsAuthenticated(true)

        toast({
          title: "Inscription réussie",
          description: `Bienvenue ${result.prenom} ${result.nom} ! Votre compte a été créé.`,
        })

        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur d'inscription"
        toast({
          title: "Erreur d'inscription",
          description: message,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
      return userData
    } catch (error) {
      console.error("Erreur lors du rafraîchissement de l'utilisateur:", error)
      throw error
    }
  }, [])

  const updateProfile = useCallback(
    async (data: {
      nom?: string
      prenom?: string
      specialite?: string
      niveau?: string
      name?: string // Handle full name update from settings
    }) => {
      setIsLoading(true)
      try {
        // If 'name' is provided (full name), split it into prenom and nom
        const updateData = { ...data }
        if (data.name) {
          const parts = data.name.trim().split(/\s+/)
          updateData.prenom = parts[0] || ""
          updateData.nom = parts.slice(1).join(" ") || ""
          delete updateData.name
        }

        const updatedUser = await api.updateProfile(updateData)
        setUser(updatedUser)

        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été enregistrées.",
        })

        return updatedUser
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour"
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  }
}

// ============================================================================
// COURSES HOOK - ADAPTÉ POUR DJANGO BACKEND
// ============================================================================

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const fetchCourses = useCallback(
    async (filters?: {
      search?: string
      enseignant_id?: string
    }) => {
      setIsLoading(true)
      try {
        const result = await api.getAllCourses(filters)
        setCourses(result)
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur lors du chargement des cours"
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const fetchMyCourses = useCallback(
    async () => {
      setIsLoading(true)
      try {
        const result = await api.getMyCourses()
        setCourses(result)
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur lors du chargement de vos cours"
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const createCourse = useCallback(
    async (courseData: {
      titre: string
      description: string
      code?: string
    }) => {
      setIsLoading(true)
      try {
        const course = await api.createCourse(courseData)

        toast({
          title: "Cours créé",
          description: `Le cours "${course.titre}" a été créé avec succès.`,
        })

        // Ajouter le cours à la liste locale
        setCourses(prev => [course, ...prev])

        return course
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur lors de la création du cours"
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const updateCourse = useCallback(
    async (
      id: string,
      data: {
        titre?: string
        description?: string
        code?: string
      }
    ) => {
      setIsLoading(true)
      try {
        const updatedCourse = await api.updateCourse(id, data)

        toast({
          title: "Cours modifié",
          description: `Le cours a été modifié avec succès.`,
        })

        // Mettre à jour dans la liste locale
        setCourses(prev => prev.map(c => c.id === id ? updatedCourse : c))

        return updatedCourse
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur lors de la modification"
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const deleteCourse = useCallback(
    async (id: string) => {
      setIsLoading(true)
      try {
        await api.deleteCourse(id)

        toast({
          title: "Cours supprimé",
          description: "Le cours a été supprimé avec succès.",
        })

        // Retirer de la liste locale
        setCourses(prev => prev.filter(c => c.id !== id))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur lors de la suppression"
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const enrollInCourse = useCallback(
    async (courseId: string) => {
      setIsLoading(true)
      try {
        const result = await api.enrollInCourse(courseId)

        toast({
          title: "Inscription réussie",
          description: "Vous êtes maintenant inscrit à ce cours.",
        })

        // Mettre à jour dans la liste locale
        setCourses(prev => prev.map(c =>
          c.id === courseId
            ? { ...c, est_inscrit: true, nb_etudiants: c.nb_etudiants + 1 }
            : c
        ))

        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur lors de l'inscription"
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const unenrollFromCourse = useCallback(
    async (courseId: string) => {
      setIsLoading(true)
      try {
        await api.unenrollFromCourse(courseId)

        toast({
          title: "Désinscription réussie",
          description: "Vous n'êtes plus inscrit à ce cours.",
        })

        // Mettre à jour dans la liste locale
        setCourses(prev => prev.map(c =>
          c.id === courseId
            ? { ...c, est_inscrit: false, nb_etudiants: c.nb_etudiants - 1 }
            : c
        ))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur lors de la désinscription"
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  return {
    courses,
    isLoading,
    fetchCourses,
    fetchMyCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollInCourse,
    unenrollFromCourse,
  }
}

// ============================================================================
// DOCUMENTS HOOK - ADAPTÉ POUR DJANGO BACKEND
// ============================================================================

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  const uploadDocument = useCallback(
    async (file: File, titre: string) => {
      setIsLoading(true)
      setUploadProgress(0)

      try {
        // Simuler la progression
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 200)

        const result = await api.uploadDocument(file, titre)

        clearInterval(progressInterval)
        setUploadProgress(100)

        toast({
          title: "Document uploadé",
          description: `Le document "${result.titre}" a été uploadé avec succès.`,
        })

        // Ajouter à la liste locale
        setDocuments(prev => [result, ...prev])

        // Réinitialiser la progression
        setTimeout(() => setUploadProgress(0), 1000)

        return result
      } catch (error) {
        setUploadProgress(0)
        const message = error instanceof Error ? error.message : "Erreur lors de l'upload"
        toast({
          title: "Erreur d'upload",
          description: message,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const getDocumentJSON = useCallback(
    async (documentId: string) => {
      setIsLoading(true)
      try {
        const result = await api.getDocumentJSON(documentId)
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur lors du chargement"
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  return {
    documents,
    isLoading,
    uploadProgress,
    uploadDocument,
    getDocumentJSON,
  }
}