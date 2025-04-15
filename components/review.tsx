"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface Review {
  id: number
  created_at: string
  team_id: string
  stage: string | null
  completed_on: string | null
  result: string | null
  is_completed: boolean | null
  department: string | null
}

export function Review() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeamReviews()
  }, [])

  const fetchTeamReviews = async () => {
    try {
      setLoading(true)

      // Get the student data from session storage
      const studentData = sessionStorage.getItem("studentData")
      if (!studentData) {
        throw new Error("No student data found")
      }

      const student = JSON.parse(studentData)
      if (!student.team_id) {
        throw new Error("Student is not part of a team")
      }

      // Fetch reviews for the team where is_completed is false
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("team_id", student.team_id)
        .eq("is_completed", false)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setReviews(data || [])
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast.error("Failed to load review data")
    } finally {
      setLoading(false)
    }
  }

  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review</h1>
        <p className="text-muted-foreground">Check your pending reviews and submission requirements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
          <CardDescription>Reviews that require your attention</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No pending reviews found for your team</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{review.stage || "Unnamed Review"}</h3>
                      <p className="text-sm text-gray-500">Scheduled on: {formatDate(review.created_at)}</p>
                      {review.department && (
                        <p className="text-xs text-gray-500 mt-1">Department: {review.department}</p>
                      )}
                    </div>
                    <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">Pending</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission Guidelines</CardTitle>
          <CardDescription>Follow these guidelines for your review submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium">Project Proposal</h3>
              <p className="text-sm text-gray-500 mt-1">
                Submit a 2-3 page document outlining your project idea, objectives, methodology, and expected outcomes.
              </p>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-medium">Mid-term Evaluation</h3>
              <p className="text-sm text-gray-500 mt-1">
                Prepare a progress report and a presentation demonstrating your current implementation and addressing
                any challenges.
              </p>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-medium">Final Submission</h3>
              <p className="text-sm text-gray-500 mt-1">
                Submit your complete project with documentation, source code, and a presentation for final evaluation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
