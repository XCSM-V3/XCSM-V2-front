import { api } from "@/lib/api"

/**
 * Service pour interagir avec l'API des documents
 */
const documentsService = {
  // Récupérer tous les documents
  getAllDocuments: async () => {
    try {
      const response = await api.get("documents")
      return response.documents
    } catch (error) {
      console.error("Error fetching documents:", error)
      throw error
    }
  },

  // Rechercher des documents
  searchDocuments: async (query) => {
    try {
      const response = await api.get("documents", { query })
      return response.documents
    } catch (error) {
      console.error("Error searching documents:", error)
      throw error
    }
  },

  // Récupérer un document par ID
  getDocumentById: async (id) => {
    try {
      const response = await api.get(`documents/${id}`)
      return response.document
    } catch (error) {
      console.error(`Error fetching document ${id}:`, error)
      throw error
    }
  },

  // Créer un nouveau document
  createDocument: async (documentData) => {
    try {
      const response = await api.post("documents", documentData)
      return response.document
    } catch (error) {
      console.error("Error creating document:", error)
      throw error
    }
  },

  // Mettre à jour un document
  updateDocument: async (id, documentData) => {
    try {
      const response = await api.put(`documents/${id}`, documentData)
      return response.document
    } catch (error) {
      console.error(`Error updating document ${id}:`, error)
      throw error
    }
  },

  // Supprimer un document
  deleteDocument: async (id) => {
    try {
      const response = await api.delete(`documents/${id}`)
      return response.document
    } catch (error) {
      console.error(`Error deleting document ${id}:`, error)
      throw error
    }
  },
}

export default documentsService
