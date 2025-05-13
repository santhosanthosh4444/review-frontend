"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Paperclip, ExternalLink, Trash2, CheckCircle, XCircle, FileText } from "lucide-react"
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

interface Template {
  id: number
  created_at: string
  link: string | null
  name: string | null
  review: string | null
}

export function Review() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [attachments, setAttachments] = useState<Record<number, Attachment[]>>({})
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [currentReviewId, setCurrentReviewId] = useState<number | null>(null)
  const [currentReviewStage, setCurrentReviewStage] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchTeamReviews()
    fetchAllTemplates()
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

  const fetchAllTemplates = async () => {
    try {
      // Fetch all templates from the review_templates table
      const { data, error } = await supabase
        .from("review_templates")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setTemplates(data || [])
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast.error("Failed to load templates")
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

  const handleViewTemplates = (reviewId: number, stage: string | null) => {
    setCurrentReviewId(reviewId)
    setCurrentReviewStage(stage)

    // Filter templates for this review stage
    setTemplatesLoading(true)
    const filtered = templates.filter(
      (template) =>
        !template.review || template.review === stage || template.review.toLowerCase() === stage?.toLowerCase(),
    )
    setFilteredTemplates(filtered)
    setTemplatesLoading(false)

    setIsTemplateModalOpen(true)
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

                  {/* Buttons section */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewTemplates(review.id, review.stage)}
                      className="text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      View Templates
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddAttachment(review.id)}
                      className="text-xs"
                    >
                      <Paperclip className="h-3 w-3 mr-1" />
                      Add Attachment
                    </Button>
                  </div>

                  {/* Attachments section */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Attachments</h4>
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

      {/* Templates Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title={`Templates for ${currentReviewStage || "Review"}`}
      >
        <div className="py-4">
          {templatesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No templates available for this review</div>
          ) : (
            <div className="space-y-4">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="font-medium">{template.name || "Unnamed Template"}</h3>
                        {template.review && <p className="text-xs text-gray-500 mt-1">For: {template.review}</p>}
                      </div>
                    </div>
                    {template.link && (
                      <a
                        href={template.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <span className="mr-1">Open</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
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
