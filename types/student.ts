export interface Student {
    id: number
    created_at: string
    name: string | null
    email: string | null
    password: string | null
    team_id: string | null
    department: string | null
    section: string | null
    student_id: string
  }
  
  export interface Team {
    id: number
    created_at: string
    team_id: string
    team_lead: string
    theme: string | null // Changed from current_status to theme
    is_approved: boolean | null
    code: string | null
    mentor: string | null
  }
  