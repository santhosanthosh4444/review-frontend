"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Paperclip, ExternalLink, Trash2, CheckCircle, XCircle } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { FileUpload } from "@/components/file-upload"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

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

interface Attachment {
  id: number
  created_at: string
  review_id: number
  attachment_name: string
  link: string
}

export function Review() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [attachments, setAttachments] = useState<Record<number, Attachment[]>>({})
  const [loading, setLoading] = useState(true)
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false)
  const [currentReviewId, setCurrentReviewId] = useState<number | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

      // Fetch all reviews for the team
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("team_id", student.team_id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setReviews(data || [])

      // Fetch attachments for each review
      if (data && data.length > 0) {
        const reviewIds = data.map((review) => review.id)
        await fetchAttachments(reviewIds)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast.error("Failed to load review data")
    } finally {
      setLoading(false)
    }
  }

  const fetchAttachments = async (reviewIds: number[]) => {
    try {
      const { data, error } = await supabase
        .from("review_attachments")
        .select("*")
        .in("review_id", reviewIds)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      // Group attachments by review_id
      const groupedAttachments: Record<number, Attachment[]> = {}
      data?.forEach((attachment) => {
        if (!groupedAttachments[attachment.review_id]) {
          groupedAttachments[attachment.review_id] = []
        }
        groupedAttachments[attachment.review_id].push(attachment)
      })

      setAttachments(groupedAttachments)
    } catch (error) {
      console.error("Error fetching attachments:", error)
      toast.error("Failed to load attachments")
    }
  }

  const handleAddAttachment = (reviewId: number) => {
    setCurrentReviewId(reviewId)
    setIsAttachmentModalOpen(true)
  }

  const handleAttachmentUploadComplete = async (name: string, url: string) => {
    if (!currentReviewId) return

    try {
      const { error } = await supabase.from("review_attachments").insert([
        {
          review_id: currentReviewId,
          attachment_name: name,
          link: url,
        },
      ])

      if (error) throw error

      toast.success("Attachment added successfully")
      setIsAttachmentModalOpen(false)

      // Refresh attachments
      const reviewIds = reviews.map((review) => review.id)
      await fetchAttachments(reviewIds)
    } catch (error) {
      console.error("Error adding attachment:", error)
      toast.error("Failed to add attachment")
    }
  }

  const handleDeleteAttachment = (attachment: Attachment) => {
    setAttachmentToDelete(attachment)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteAttachment = async () => {
    if (!attachmentToDelete) return

    try {
      setIsDeleting(true)
      const { error } = await supabase.from("review_attachments").delete().eq("id", attachmentToDelete.id)

      if (error) throw error

      toast.success("Attachment deleted successfully")

      // Update local state
      setAttachments((prev) => {
        const updated = { ...prev }
        if (updated[attachmentToDelete.review_id]) {
          updated[attachmentToDelete.review_id] = updated[attachmentToDelete.review_id].filter(
            (a) => a.id !== attachmentToDelete.id,
          )
        }
        return updated
      })
    } catch (error) {
      console.error("Error deleting attachment:", error)
      toast.error("Failed to delete attachment")
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
      setAttachmentToDelete(null)
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
        <p className="text-muted-foreground">Check your reviews and submission requirements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
          <CardDescription>Reviews for your team</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No reviews found for your team</div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{review.stage || "Unnamed Review"}</h3>
                      <p className="text-sm text-gray-500">Scheduled on: {formatDate(review.created_at)}</p>
                      {review.department && (
                        <p className="text-xs text-gray-500 mt-1">Department: {review.department}</p>
                      )}
                      {review.completed_on && (
                        <p className="text-xs text-gray-500 mt-1">Completed on: {formatDate(review.completed_on)}</p>
                      )}
                      {review.result && <p className="text-sm mt-2 border-l-2 border-gray-300 pl-2">{review.result}</p>}
                    </div>
                    <div className="flex items-center">
                      {review.is_completed ? (
                        <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </div>
                      ) : (
                        <div className="flex items-center bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          Pending
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attachments section */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Attachments</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddAttachment(review.id)}
                        className="text-xs"
                      >
                        <Paperclip className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>

                    {attachments[review.id]?.length > 0 ? (
                      <div className="space-y-2">
                        {attachments[review.id].map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm"
                          >
                            <div className="flex items-center">
                              <Paperclip className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{attachment.attachment_name}</span>
                            </div>
                            <div className="flex space-x-2">
                              <a
                                href={attachment.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteAttachment(attachment)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No attachments yet</p>
                    )}
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

      {/* Attachment Upload Modal */}
      <Modal isOpen={isAttachmentModalOpen} onClose={() => setIsAttachmentModalOpen(false)} title="Add Attachment">
        <FileUpload
          onUploadComplete={handleAttachmentUploadComplete}
          onCancel={() => setIsAttachmentModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteAttachment}
        title="Delete Attachment"
        message="Are you sure you want to delete this attachment? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  )
}
