"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Student } from "@/types/student"

export default function TeamsPage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [teamCode, setTeamCode] = useState("")
  const [loading, setLoading] = useState(false)
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

    // If student already has a team, redirect to dashboard
    if (parsedStudentData.team_id) {
      router.push("/dashboard")
    }
  }, [router])

  // Generate a random 6-character code
  const generateUniqueCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return code
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!student) {
      toast.error("You must be logged in")
      return
    }

    try {
      setLoading(true)

      // Generate a unique code
      const code = generateUniqueCode()

      // Create a new team
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert([
          {
            team_lead: student.student_id,
            code,
            is_approved: null,
          },
        ])
        .select()

      if (teamError) {
        throw teamError
      }

      // Get the created team
      const newTeam = teamData[0]

      // Update the student's team_id
      const { error: updateError } = await supabase
        .from("students")
        .update({ team_id: newTeam.team_id })
        .eq("id", student.id)

      if (updateError) {
        throw updateError
      }

      // Update session storage
      const updatedStudent = { ...student, team_id: newTeam.team_id }
      sessionStorage.setItem("studentData", JSON.stringify(updatedStudent))

      toast.success("Team created successfully!")
      router.push("/dashboard")
    } catch (error) {
      console.error("Team creation error:", error)
      toast.error("Failed to create team. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!student) {
      toast.error("You must be logged in")
      return
    }

    if (!teamCode) {
      toast.error("Please enter a team code")
      return
    }

    try {
      setLoading(true)

      // Find the team with the given code
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*, students!inner(*)")
        .eq("code", teamCode)
        .single()

      if (teamError) {
        toast.error("Invalid team code")
        return
      }

      // Count team members
      const { count, error: countError } = await supabase
        .from("students")
        .select("*", { count: "exact" })
        .eq("team_id", teamData.team_id)

      if (countError) {
        throw countError
      }

      // Check if team is full (max 4 members)
      if (count && count >= 4) {
        toast.error("This team is already full (maximum 4 members)")
        return
      }

      // Update the student's team_id
      const { error: updateError } = await supabase
        .from("students")
        .update({ team_id: teamData.team_id })
        .eq("id", student.id)

      if (updateError) {
        throw updateError
      }

      // Update session storage
      const updatedStudent = { ...student, team_id: teamData.team_id }
      sessionStorage.setItem("studentData", JSON.stringify(updatedStudent))

      toast.success("Successfully joined the team!")
      router.push("/dashboard")
    } catch (error) {
      console.error("Team joining error:", error)
      toast.error("Failed to join team. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!student) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Team Setup</CardTitle>
          <CardDescription className="text-center">Create a new team or join an existing one</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="create">Create Team</TabsTrigger>
              <TabsTrigger value="join">Join Team</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Team"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join">
              <form onSubmit={handleJoinTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamCode">Team Code</Label>
                  <Input
                    id="teamCode"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character team code"
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Joining..." : "Join Team"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
