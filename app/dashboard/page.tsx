"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/sidebar"
import { Review } from "@/components/review"
import { ProjectManagement } from "@/components/project-management"
import type { Student } from "@/types/student"

interface Team {
  id: number
  team_id: string
  team_lead: string
  theme: string
  is_approved: boolean
  code: string
  created_at: string
}

interface Project {
  id: number
  title: string | null
  is_approved: boolean | null
}

// Theme badge colors
const THEME_COLORS: Record<string, string> = {
  Fullstack: "bg-blue-100 text-blue-800",
  AIML: "bg-green-100 text-green-800",
  Blockchain: "bg-purple-100 text-purple-800",
  CyberSecurity: "bg-red-100 text-red-800",
}

export default function Dashboard() {
  const [student, setStudent] = useState<Student | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<Student[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState("dashboard")
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const studentId = sessionStorage.getItem("studentId")
    const studentData = sessionStorage.getItem("studentData")

    if (!studentId || !studentData) {
      router.push("/login")
      return
    }

    const parsedStudentData = JSON.parse(studentData)
    setStudent(parsedStudentData)

    // Check if student has a team
    if (!parsedStudentData.team_id) {
      router.push("/teams")
      return
    }

    // Fetch team data
    fetchTeamData(parsedStudentData.team_id)
  }, [router])

  const fetchTeamData = async (teamId: string) => {
    try {
      setLoading(true)

      // Fetch team details
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("team_id", teamId)
        .single()

      if (teamError) {
        throw teamError
      }

      setTeam(teamData)

      // Fetch team members
      const { data: membersData, error: membersError } = await supabase
        .from("students")
        .select("*")
        .eq("team_id", teamId)

      if (membersError) {
        throw membersError
      }

      setTeamMembers(membersData)

      // Fetch project data
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, title, is_approved")
        .eq("team_id", teamId)
        .maybeSingle()

      if (projectError) {
        throw projectError
      }

      setProject(projectData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("studentId")
    sessionStorage.removeItem("studentData")
    router.push("/login")
  }

  const handleNavigate = (view: string) => {
    setActiveView(view)
  }

  const isTeamLead = student && team && student.student_id === team.team_lead
  const hasApprovedProject = project && project.is_approved === true

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const renderDashboardContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">View your profile and team information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Student Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-gray-500">{student?.name || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-gray-500">{student?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Department</p>
                <p className="text-sm text-gray-500">{student?.department || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Section</p>
                <p className="text-sm text-gray-500">{student?.section || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Student ID</p>
                <p className="text-sm text-gray-500">{student?.student_id}</p>
              </div>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>{isTeamLead ? "You are the team leader" : "Your team details"}</CardDescription>
          </CardHeader>
          <CardContent>
            {team ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Theme</p>
                    <Badge className={`mt-1 font-normal ${THEME_COLORS[team.theme] || "bg-gray-100 text-gray-800"}`}>
                      {team.theme}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Team Code</p>
                    <p className="text-sm font-medium text-primary">{team.code}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Share this code with others to join your team (max 4 members)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Approval Status</p>
                    <p className={`text-sm ${team.is_approved ? "text-green-500" : "text-amber-500"}`}>
                      {team.is_approved ? "Approved" : "Pending Approval"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Team Members ({teamMembers.length}/4)</p>
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium">{member.name || "Unnamed"}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                        {member.student_id === team.team_lead && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Team Lead</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Team information not available</p>
                <Button className="mt-4" variant="outline" onClick={() => router.push("/teams")}>
                  Set Up Team
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Management Section */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Project Management</h2>
        {team && <ProjectManagement teamId={team.team_id} isTeamLead={!!isTeamLead} />}
      </div>
    </div>
  )

  const renderProjectContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project</h1>
        <p className="text-muted-foreground">Manage your project details</p>
      </div>
      {team && <ProjectManagement teamId={team.team_id} isTeamLead={!!isTeamLead} />}
    </div>
  )

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return renderDashboardContent()
      case "project":
        return renderProjectContent()
      case "review":
        return <Review />
      default:
        return renderDashboardContent()
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar onNavigate={handleNavigate} activeView={activeView} hasApprovedProject={!!hasApprovedProject} />
      <div className="flex-1 p-8 overflow-auto">{renderContent()}</div>
    </div>
  )
}
