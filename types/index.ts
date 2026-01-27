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
  // Pour les données mockées
  teacher?: string
  progress?: number
  lastAccessed?: string | null
  tags?: string[]
  sections?: CourseSection[]
  resources?: CourseResource[]
  qcm?: CourseQCM[]
}

export interface CourseSection {
  id: string
  title: string
  content: string
}

export interface CourseResource {
  id: string
  title: string
  type: string
  url: string
}

export interface CourseQCM {
  id: string
  title: string
  questions: Question[]
}

export interface Question {
  id: string
  text: string
  options: Option[]
  correctAnswer?: string
  correctAnswers?: string[]
  type: "single" | "multiple"
}

export interface Option {
  id: string
  text: string
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

export interface ApiResponse<T> {
  message?: string
  data?: T
  courses?: T[]
  [key: string]: any
}

export interface TokenResponse {
  access_token: string
  token_type: "bearer"
  expires_in?: number
}
