// lib/api.ts - Client API COMPLET pour XCSM (VERSION CORRIGÉE)

// ⚠️ IMPORTANT: L'URL de base ne doit contenir que http://localhost:8000
// Le préfixe /api/ est ajouté automatiquement ci-dessous
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const API_BASE = `${API_URL}/api/v1` // ← Ajout du préfixe /api/

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string
  email: string
  nom: string
  prenom: string
  role: "enseignant" | "etudiant" | "admin"
  profil_id?: string
  profil?: {
    specialite?: string
    niveau?: string
    nb_cours?: number
    nb_cours_inscrits?: number
  }
  date_creation: string
  derniere_connexion?: string
}

export interface Course {
  id: string
  code: string
  titre: string
  description: string
  enseignant: string
  enseignant_nom: string
  nb_etudiants: number
  nb_parties: number
  date_creation: string
  est_inscrit?: boolean
  est_proprietaire?: boolean
  progress?: number
  last_accessed?: string
}

export interface Document {
  id: string
  titre: string
  fichier_original?: string
  type_fichier: "PDF" | "DOCX"
  statut_traitement: "EN_ATTENTE" | "TRAITE" | "ERREUR"
  date_upload: string
  enseignant?: string
  enseignant_nom?: string
  taille_fichier?: string
  mongo_transforme_id?: string
}

export interface Granule {
  id: string
  titre: string
  type_contenu: string
  ordre: number
  mongo_contenu_id?: string
  sous_section?: string
  chemin_hierarchique?: {
    cours: string
    partie: string
    chapitre: string
    section: string
    sous_section: string
  }
  contenu?: any
}

export interface Etudiant {
  id: string
  nom: string
  prenom: string
  email: string
  niveau: string
}

export interface CourseStats {
  cours_id: string
  cours_titre: string
  nb_etudiants: number
  nb_parties: number
  nb_chapitres: number
  date_creation: string
}

export interface Reponse {
  id: string
  texte: string
  est_correcte: boolean
  feedback: string
}

export interface Question {
  id: string
  enonce: string
  type_question: string
  point: number
  ordre: number
  reponses: Reponse[]
}

export interface Exercise {
  id: string
  titre: string
  description: string
  granule: string
  cours: string
  date_creation: string
  difficulte: number
  questions: Question[]
}

// ============================================================================
// CLIENT API
// ============================================================================

class API {
  private getHeaders(includeAuth = true, isFormData = false) {
    const headers: any = isFormData ? {} : {
      "Content-Type": "application/json",
    }

    if (includeAuth && typeof window !== "undefined") {
      const token = localStorage.getItem("access_token")
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
    }

    return headers
  }

  /**
   * Méthode centrale pour toutes les requêtes (Wrapper Fetch avec Intercepteur 401)
   */
  private async request<T>(endpoint: string, options: RequestInit = {}, isFormData = false, includeAuth = true): Promise<T> {
    const url = `${API_BASE}${endpoint}`

    // 1. Préparer les headers
    const headers = this.getHeaders(includeAuth, isFormData)
    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    }

    try {
      // 2. Première tentative
      let res = await fetch(url, config)

      // 3. Gestion 401 (Token Expiré)
      if (res.status === 401 && includeAuth) {
        console.warn("⚠️ 401 détecté - Tentative de refresh token...")
        try {
          // Tenter de rafraîchir
          const newToken = await this.refreshToken()

          // Mettre à jour le header avec le nouveau token
          config.headers = {
            ...config.headers,
            "Authorization": `Bearer ${newToken}`
          }

          // 4. Retry (Rejouer la requête)
          console.log("🔄 Re-tentative de la requête avec nouveau token...")
          res = await fetch(url, config)

        } catch (refreshError) {
          console.error("❌ Echec du refresh token:", refreshError)
          this.logout() // Déconnexion forcée
          throw new Error("Session expirée. Veuillez vous reconnecter.")
        }
      }

      // 5. Gestion des erreurs HTTP standard
      if (!res.ok) {
        let errorMessage = `Erreur ${res.status}`
        try {
          const text = await res.text()
          try {
            const json = JSON.parse(text)
            errorMessage = json.detail || json.message || json.error || JSON.stringify(json)
          } catch {
            errorMessage = text.substring(0, 300)
          }
        } catch {
          // Ignore
        }
        throw new Error(errorMessage)
      }

      // 6. Succès : Parsing JSON
      const text = await res.text()
      return text ? JSON.parse(text) as T : {} as T

    } catch (error) {
      throw error
    }
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    // Legacy method kept for interface compatibility if needed, 
    // but strictly we should use request() now.
    return this.request<T>('', {})
  }

  // ==========================================================================
  // AUTHENTIFICATION
  // ==========================================================================

  /**
   * Connexion utilisateur
   * CORRIGÉ: Utilise /auth/login/ (pas /api/v1/auth/login/)
   */
  async login(email: string, password: string): Promise<User> {
    const data = await this.request<{
      message: string
      user: User
      tokens: { access: string; refresh: string }
    }>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, false, false)

    // Stocker les tokens et l'utilisateur
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", data.tokens.access)
      localStorage.setItem("refresh_token", data.tokens.refresh)
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("userRole", data.user.role)
    }

    return data.user
  }
  /**
   * Inscription utilisateur
   * CORRIGÉ: Utilise /auth/register/
   */
  async register(userData: {
    email: string
    nom: string
    prenom: string
    password: string
    password2: string
    role: "enseignant" | "etudiant"
  }): Promise<User> {
    const data = await this.request<{
      message: string
      user: User
      tokens: { access: string; refresh: string }
    }>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(userData),
    }, false, false)

    // Stocker les tokens et l'utilisateur
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", data.tokens.access)
      localStorage.setItem("refresh_token", data.tokens.refresh)
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("userRole", data.user.role)
    }

    return data.user
  }

  /**
   * Récupérer l'utilisateur courant
   */
  async getCurrentUser(): Promise<User> {
    const user = await this.request<User>("/auth/me/")

    // Mettre à jour le localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user))
    }

    return user
  }

  /**
   * Mettre à jour le profil
   */
  async updateProfile(data: {
    nom?: string
    prenom?: string
    specialite?: string
    niveau?: string
  }): Promise<User> {
    return this.request<User>("/auth/profile/", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(
    old_password: string,
    new_password: string,
    new_password2: string
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/change-password/", {
      method: "POST",
      body: JSON.stringify({ old_password, new_password, new_password2 }),
    })
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    if (typeof window === "undefined") return

    const refreshToken = localStorage.getItem("refresh_token")

    if (refreshToken) {
      try {
        await fetch(`${API_BASE}/auth/logout/`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({ refresh: refreshToken }),
        })
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error)
      }
    }

    // Nettoyer le localStorage
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    localStorage.removeItem("userRole")
  }

  /**
   * Vérifier si authentifié
   */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem("access_token")
  }

  /**
   * Rafraîchir le token (AJOUTÉ)
   * Utilise l'endpoint standard de simplejwt
   */
  async refreshToken(): Promise<string> {
    if (typeof window === "undefined") {
      throw new Error("Window is not defined")
    }

    const refreshToken = localStorage.getItem("refresh_token")

    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    const res = await fetch(`${API_BASE}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!res.ok) {
      // Si le refresh échoue, déconnecter
      this.logout()
      throw new Error("Token refresh failed")
    }

    const data = await res.json()
    localStorage.setItem("access_token", data.access)

    return data.access
  }

  // ==========================================================================
  // COURS
  // ==========================================================================

  /**
   * Récupérer tous les cours (catalogue public)
   */
  async getAllCourses(filters?: {
    search?: string
    enseignant_id?: string
  }): Promise<Course[]> {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.enseignant_id) params.append("enseignant_id", filters.enseignant_id)

    return this.request<Course[]>(`/cours/${params.toString() ? "?" + params.toString() : ""}`)
  }

  /**
   * Récupérer mes cours (enseignant: créés / étudiant: inscrits)
   */
  async getMyCourses(): Promise<Course[]> {
    const data = await this.request<{
      role: string
      count: number
      cours: Course[]
    }>("/cours/mes-cours/", {
      cache: "no-store",
    })

    return data.cours
  }

  /**
   * Uploader une ressource (image) pour un cours
   */
  async uploadResource(coursId: string, file: File): Promise<any> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("titre", file.name)

    return this.request<any>(
      `/cours/${coursId}/upload-resource/`,
      {
        method: "POST",
        body: formData,
      },
      true // isFormData = true
    )
  }

  /**
   * Récupérer un cours par ID
   */
  async getCourse(id: string): Promise<Course> {
    return this.request<Course>(`/cours/${id}/`)
  }

  /**
   * Récupérer les ressources d'un cours
   */
  async getResources(courseId: string): Promise<any[]> {
    return this.request<any[]>(`/cours/${courseId}/ressources/`)
  }

  /**
   * Récupérer le contenu complet d'un cours (structure + granules)
   */
  async getCourseContent(id: string): Promise<any> {
    return this.request<any>(`/cours/${id}/contenu/`)
  }

  /**
   * Créer un cours (enseignant uniquement)
   */
  async createCourse(data: {
    titre: string
    description: string
    code?: string
  }): Promise<Course> {
    const result = await this.request<{
      message: string
      cours: Course
    }>("/cours/", {
      method: "POST",
      body: JSON.stringify(data),
    })

    return result.cours
  }

  /**
   * Modifier un cours (propriétaire uniquement)
   */
  async updateCourse(
    id: string,
    data: {
      titre?: string
      description?: string
      code?: string
    }
  ): Promise<Course> {
    const result = await this.request<{
      message: string
      cours: Course
    }>(`/cours/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })

    return result.cours
  }

  /**
   * Supprimer un cours (propriétaire uniquement)
   */
  async deleteCourse(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/cours/${id}/`, {
      method: "DELETE",
    })
  }

  /**
   * Publier un cours (propriétaire uniquement)
   */
  async publishCourse(id: string): Promise<Course> {
    return this.updateCourse(id, { est_publie: true } as any)
  }

  /**
   * S'inscrire à un cours (étudiant uniquement)
   */
  async enrollInCourse(courseId: string): Promise<{
    message: string
    cours_id: string
    cours_titre: string
  }> {
    return this.request<{
      message: string
      cours_id: string
      cours_titre: string
    }>(`/cours/${courseId}/inscrire/`, {
      method: "POST",
      body: JSON.stringify({}),
    })
  }

  async unenrollFromCourse(courseId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/cours/${courseId}/desinscrire/`, {
      method: "POST",
      body: JSON.stringify({}),
    })
  }

  /**
   * Marquer un granule comme consulté (étudiant uniquement)
   */
  async trackProgression(courseId: string, granuleId: string): Promise<any> {
    return this.request<any>(`/cours/${courseId}/consulter-granule/`, {
      method: "POST",
      body: JSON.stringify({ granule_id: granuleId }),
    })
  }

  /**
   * Récupérer les étudiants d'un cours (propriétaire uniquement)
   */
  async getCourseStudents(courseId: string): Promise<{
    count: number
    etudiants: Etudiant[]
  }> {
    return this.request<{
      count: number
      etudiants: Etudiant[]
    }>(`/cours/${courseId}/etudiants/`)
  }

  /**
   * Récupérer les documents d'un cours
   */
  async getCourseDocuments(courseId: string): Promise<{
    count: number
    documents: Document[]
  }> {
    return this.request<{
      count: number
      documents: Document[]
    }>(`/cours/${courseId}/documents/`)
  }

  /**
   * Récupérer les statistiques d'un cours (propriétaire uniquement)
   */
  async getCourseStatistics(courseId: string): Promise<CourseStats> {
    return this.request<CourseStats>(`/cours/${courseId}/statistiques/`)
  }

  // ==========================================================================
  // DOCUMENTS
  // ==========================================================================

  /**
   * Uploader un document (PDF ou DOCX)
   */
  async uploadDocument(
    file: File,
    titre: string
  ): Promise<Document & { message: string; statut: string }> {
    const formData = new FormData()
    formData.append("fichier_original", file)
    formData.append("titre", titre)

    return this.request<Document & { message: string; statut: string }>(
      "/documents/upload/",
      {
        method: "POST",
        body: formData,
      },
      true // isFormData = true
    )
  }

  /**
   * Récupérer la structure JSON d'un document
   */
  async getDocumentJSON(documentId: string): Promise<{
    fichier_info: any
    json_structure: {
      cours: any
      parties: any[]
      chapitres: any[]
      sections: any[]
      granules: any[]
    }
  }> {
    return this.request<any>(`/documents/${documentId}/json/`)
  }

  /**
   * Récupérer tous les documents de l'utilisateur
   */
  async getDocuments(): Promise<Document[]> {
    return this.request<Document[]>("/documents/")
  }

  /**
   * Supprimer un document
   */
  async deleteDocument(id: string): Promise<void> {
    await this.request(`/documents/${id}/`, {
      method: "DELETE",
    })
  }

  async updateDocumentStructure(
    id: string,
    html_content: string,
    courseId?: string
  ): Promise<any> {
    const body: any = { html_content }
    if (courseId) {
      body.course_id = courseId
    }

    return this.request<any>(`/documents/${id}/structure/`, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  }

  // ==========================================================================
  // EXERCICES (QCM)
  // ==========================================================================

  /**
   * Récupérer tous les exercices de l'utilisateur (enseignant)
   */
  async getExercises(): Promise<Exercise[]> {
    return this.request<Exercise[]>("/exercices/")
  }

  // ==========================================================================
  // GRANULES
  // ==========================================================================

  /**
   * Rechercher dans les granules avec authentification et filtrage par rôle
   */
  async searchGranules(query: string, filters?: {
    cours_id?: string
  }): Promise<{
    query: string
    count: number
    user_role: string
    accessible_courses_count: number
    results: Array<{
      granule_id: string
      mongo_id: string
      titre: string
      type_contenu: string
      ordre: number
      content_preview: string
      cours: {
        id: string
        titre: string
        code: string
      }
      chemin_hierarchique: {
        partie: string
        chapitre: string
        section: string
        sous_section: string
      }
      enseignant: string
      source_pdf_page: number | null
    }>
  }> {
    const params = new URLSearchParams({ q: query })
    if (filters?.cours_id) params.append('cours_id', filters.cours_id)

    return this.request<any>(`/granules/search/?${params.toString()}`)
  }

  /**
   * Récupérer un granule par ID
   */
  async getGranule(granuleId: string): Promise<Granule> {
    return this.request<Granule>(`/granules/${granuleId}/`)
  }

  // ==========================================================================
  // STATISTIQUES
  // ==========================================================================

  /**
   * Récupérer les statistiques MongoDB (admin uniquement)
   */
  async getMongoStatistics(): Promise<any> {
    return this.request<any>("/statistics/mongodb/")
  }

  /**
   * Exporter un cours en JSON (propriétaire uniquement)
   * CORRIGÉ: Le bon endpoint est /cours/{id}/export-json/ pas /cours-export/
   */
  async exportCourseJSON(courseId: string): Promise<any> {
    return this.request<any>(`/cours/${courseId}/export-json/`)
  }

  // ==========================================================================
  // MÉTHODES GÉNÉRIQUES
  // ==========================================================================

  async get<T>(endpoint: string): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint.startsWith("/") ? endpoint : "/" + endpoint)
    return { data }
  }

  async post<T>(endpoint: string, body: any): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint.startsWith("/") ? endpoint : "/" + endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    })
    return { data }
  }

  async put<T>(endpoint: string, body: any): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint.startsWith("/") ? endpoint : "/" + endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    })
    return { data }
  }




  async delete(endpoint: string): Promise<void> {
    await this.request(endpoint.startsWith("/") ? endpoint : "/" + endpoint, {
      method: "DELETE",
    })
  }
}

// Instance singleton de l'API
export const api = new API()

// Export par défaut pour compatibilité
export default api