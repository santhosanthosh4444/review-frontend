"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Edit, CheckCircle, XCircle } from "lucide-react"

interface Project {
  id: number
  created_at: string
  title: string | null
  team_id: string | null
  status: string | null
  is_approved: boolean | null
  theme: string[] | null
  project_id: string | null
}

interface ProjectManagementProps {
  teamId: string
  isTeamLead: boolean
}

export function ProjectManagement({ teamId, isTeamLead }: ProjectManagementProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTheme, setSelectedTheme] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const themes = ["Web Development", "Mobile App", "AI/ML", "Blockchain", "IoT", "Cybersecurity", "Data Science"]

  useEffect(() => {
    fetchProjectData()
  }, [teamId])

  const fetchProjectData = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase.from("projects").select("*").eq("team_id", teamId).maybeSingle()

      if (error) {
        throw error
      }

      setProject(data)

      // If project exists, set form values
      if (data) {
        setTitle(data.title || "")
        setDescription(data.status || "")
        setSelectedTheme(data.theme && data.theme.length > 0 ? data.theme[0] : "")
      }
    } catch (error) {
      console.error("Error fetching project data:", error)
      toast.error("Failed to load project data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Please enter a project title")
      return
    }

    if (!description.trim()) {
      toast.error("Please enter a project description")
      return
    }

    if (!selectedTheme) {
      toast.error("Please select a project theme")
      return
    }

    try {
      setSubmitting(true)

      if (project) {
        // Update existing project
        const { error } = await supabase
          .from("projects")
          .update({
            title,
            status: description,
            theme: [selectedTheme],
          })
          .eq("id", project.id)

        if (error) throw error

        toast.success("Project updated successfully")
      } else {
        // Create new project
        const { error } = await supabase.from("projects").insert([
          {
            title,
            status: description,
            team_id: teamId,
            is_approved: false,
            theme: [selectedTheme],
          },
        ])

        if (error) throw error

        toast.success("Project created successfully")
      }

      // Refresh project data
      fetchProjectData()
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving project:", error)
      toast.error("Failed to save project")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!project && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Your team doesn't have a project yet</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground mb-4">Create a project to start your team's journey and enable reviews</p>
          <Button onClick={() => setIsEditing(true)} disabled={!isTeamLead}>
            Create Project
          </Button>
          {!isTeamLead && <p className="text-xs text-muted-foreground mt-2">Only team leaders can create projects</p>}
        </CardContent>
      </Card>
    )
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{project ? "Edit Project" : "Create Project"}</CardTitle>
          <CardDescription>
            {project ? "Update your project details" : "Add details for your new project"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter project title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Project Theme</Label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme} required>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {theme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {project ? "Updating..." : "Creating..."}
                  </>
                ) : project ? (
                  "Update Project"
                ) : (
                  "Create Project"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{project?.title}</CardTitle>
          <CardDescription>Project Details</CardDescription>
        </div>
        {isTeamLead && (
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Description</h3>
          <p className="text-sm text-gray-500 mt-1">{project?.status}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium">Theme</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {project?.theme?.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium">Approval Status</h3>
          <div className="flex items-center mt-1">
            {project?.is_approved ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">Approved</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-amber-500 mr-1" />
                <span className="text-sm text-amber-500">Pending Approval</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Created on {new Date(project?.created_at || "").toLocaleDateString()}
      </CardFooter>
    </Card>
  )
}
