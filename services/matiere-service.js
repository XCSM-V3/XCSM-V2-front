import { api } from "@/lib/api"

/**
 * Service pour interagir avec l'API des matières
 */
const matiereService = {
    // Récupérer toutes les matières (Enseignant: siennes, Etudiant: suivies)
    getAllMatieres: async () => {
        try {
            const response = await api.get("matieres/")
            // Le backend retourne directement une liste ou un objet paginé ?
            // generics.ListCreateAPIView retourne paginé si pagination activée, sinon liste.
            // Supposons liste pour l'instant ou adaptons si besoin.
            return response.data || response // Adaptation selon le wrapper 'api'
        } catch (error) {
            console.error("Error fetching matieres:", error)
            throw error
        }
    },

    // Récupérer une matière par ID
    getMatiereById: async (id) => {
        try {
            const response = await api.get(`matieres/${id}/`)
            return response.data || response
        } catch (error) {
            console.error(`Error fetching matiere ${id}:`, error)
            throw error
        }
    },

    // Créer une nouvelle matière (Enseignant seulement)
    createMatiere: async (matiereData) => {
        try {
            // matiereData = { titre, code, description, image? }
            const response = await api.post("matieres/", matiereData)
            return response.data || response
        } catch (error) {
            console.error("Error creating matiere:", error)
            throw error
        }
    },

    // Rejoindre une matière via code (Etudiant seulement)
    joinMatiere: async (code) => {
        try {
            const response = await api.post("matieres/join/", { code })
            return response.data || response
        } catch (error) {
            console.error("Error joining matiere:", error)
            throw error
        }
    },

    // Récupérer les co-enseignants d'une matière
    getCoTeachers: async (matiereId) => {
        try {
            const response = await api.get(`matieres/${matiereId}/enseignants/`)
            return response.data || response
        } catch (error) {
            console.error(`Error fetching co-teachers for matiere ${matiereId}:`, error)
            throw error
        }
    },

    // Ajouter un ou plusieurs co-enseignants à une matière
    addCoTeachers: async (matiereId, teacherIds) => {
        try {
            const response = await api.post(`matieres/${matiereId}/enseignants/`, { teacher_ids: teacherIds })
            return response.data || response
        } catch (error) {
            console.error("Error adding co-teachers:", error)
            throw error
        }
    },

    // Récupérer tous les enseignants de la plateforme
    getAllTeachers: async () => {
        try {
            const response = await api.get("enseignants/")
            return response.data || response
        } catch (error) {
            console.error("Error fetching all teachers:", error)
            throw error
        }
    },

    // Retirer un co-enseignant d'une matière
    removeCoTeacher: async (matiereId, teacherId) => {
        try {
            const response = await api.request(`matieres/${matiereId}/enseignants/`, {
                method: "DELETE",
                body: JSON.stringify({ id: teacherId }),
                headers: { "Content-Type": "application/json" }
            })
            return response.data || response
        } catch (error) {
            console.error("Error removing co-teacher:", error)
            throw error
        }
    }
}

export default matiereService
