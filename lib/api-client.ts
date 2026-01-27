const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://granule.onrender.com"

export interface User {
  id: string
  email: string
  full_name: string
  role: "student" | "teacher" | "admin"
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Course {
  id: string
  title: string
  description: string
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  is_public: boolean
  access_code?: string
  teacher_id: string
  teacher_name: string
  student_count: number
  document_count: number
  created_at: string
  updated_at?: string
}

export interface Document {
  id: string
  title: string
  description?: string
  filename: string
  content: string
  metadata: {
    format: string
    size?: number
    pages?: number
    parsing_time?: number
    [key: string]: any
  }
  parsed_successfully: boolean
  created_at: string
  updated_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: "bearer"
  expires_in?: number
}

class GranuleAPIClient {
  private token: string | null = null
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    // Try to get token from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("granule_token")
    }
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (includeAuth && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken()
        throw new Error("Session expired. Please login again.")
      }

      const errorText = await response.text()
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }

    return response.json()
  }

  private setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("granule_token", token)
    }
  }

  private clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("granule_token")
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<TokenResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: "POST",
      headers: this.getHeaders(false),
      body: JSON.stringify({
        username: email,
        password: password,
      }),
    })

    const data = await this.handleResponse<TokenResponse>(response)
    this.setToken(data.access_token)
    return data
  }

  async register(userData: {
    email: string
    full_name: string
    password: string
    role: "student" | "teacher" | "admin"
  }): Promise<{ message: string; data: Omit<User, "id" | "is_active" | "created_at"> }> {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: "POST",
      headers: this.getHeaders(false),
      body: JSON.stringify(userData),
    })

    return this.handleResponse(response)
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseURL}/users/me`, {
      headers: this.getHeaders(),
    })

    return this.handleResponse<User>(response)
  }

  // Course methods
  async getCourses(filters?: {
    category?: string
    difficulty?: string
    search?: string
  }): Promise<{ message: string; courses: Course[] }> {
    const params = new URLSearchParams()
    if (filters?.category) params.append("category", filters.category)
    if (filters?.difficulty) params.append("difficulty", filters.difficulty)
    if (filters?.search) params.append("search", filters.search)

    const url = `${this.baseURL}/courses${params.toString() ? "?" + params.toString() : ""}`
    const response = await fetch(url, {
      headers: this.getHeaders(),
    })

    return this.handleResponse(response)
  }

  async createCourse(courseData: {
    title: string
    description: string
    category: string
    difficulty: "beginner" | "intermediate" | "advanced"
    is_public: boolean
    access_code?: string
  }): Promise<Course> {
    const response = await fetch(`${this.baseURL}/courses`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(courseData),
    })

    const result = await this.handleResponse<{ message: string; data: Course }>(response)
    return result.data
  }

  async getCourse(courseId: string): Promise<Course> {
    const response = await fetch(`${this.baseURL}/courses/${courseId}`, {
      headers: this.getHeaders(),
    })

    return this.handleResponse<Course>(response)
  }

  async enrollInCourse(
    courseId: string,
    accessCode?: string,
  ): Promise<{ message: string; course_id: string; enrolled_at: string }> {
    const response = await fetch(`${this.baseURL}/courses/${courseId}/enroll`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(accessCode ? { access_code: accessCode } : {}),
    })

    return this.handleResponse(response)
  }

  // Document methods
  async uploadDocument(file: File, title?: string, description?: string): Promise<Document> {
    const formData = new FormData()
    formData.append("file", file)
    if (title) formData.append("title", title)
    if (description) formData.append("description", description)

    const response = await fetch(`${this.baseURL}/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : "",
      },
      body: formData,
    })

    return this.handleResponse<Document>(response)
  }

  async parseDocument(file: File): Promise<{
    success: boolean
    format: string
    content: string
    metadata: any
    summary: string
  }> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${this.baseURL}/documents/parse`, {
      method: "POST",
      body: formData,
    })

    return this.handleResponse(response)
  }

  async getDocuments(skip = 0, limit = 20): Promise<Document[]> {
    const params = new URLSearchParams()
    params.append("skip", skip.toString())
    params.append("limit", limit.toString())

    const response = await fetch(`${this.baseURL}/documents?${params.toString()}`, {
      headers: this.getHeaders(),
    })

    return this.handleResponse<Document[]>(response)
  }

  async getDocument(documentId: string): Promise<Document> {
    const response = await fetch(`${this.baseURL}/documents/${documentId}`, {
      headers: this.getHeaders(),
    })

    return this.handleResponse<Document>(response)
  }

  logout() {
    this.clearToken()
  }

  isAuthenticated(): boolean {
    return !!this.token
  }
}

// Create and export a singleton instance
const apiClient = new GranuleAPIClient()
export default apiClient
