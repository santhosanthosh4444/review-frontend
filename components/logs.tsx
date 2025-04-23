"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Edit, CheckCircle, XCircle, Clock } from "lucide-react"
import { WorkLogModal } from "@/components/work-log-modal"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface Log {
  id: number
  created_at: string
  student_id: string
  date: string
  expected_task: string
  completed_task: string
  mentor_approved: boolean | null
  comments: string | null
}

export function Logs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<Log | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [logToDelete, setLogToDelete] = useState<Log | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)

      // Get student ID from session storage
      const studentData = sessionStorage.getItem("studentData")
      if (!studentData) {
        throw new Error("No student data found")
      }

      const student = JSON.parse(studentData)
      if (!student.student_id) {
        throw new Error("Student ID not found")
      }

      // Fetch logs for the student
      const { data, error } = await supabase
        .from("logs")
        .select("*")
        .eq("student_id", student.student_id)
        .order("date", { ascending: false })

      if (error) {
        throw error
      }

      setLogs(data || [])
    } catch (error) {
      console.error("Error fetching logs:", error)
      toast.error("Failed to load work logs")
    } finally {
      setLoading(false)
    }
  }

  const handleEditLog = (log: Log) => {
    // Only allow editing if not approved yet
    if (log.mentor_approved !== null) {
      toast.error("Cannot edit logs that have been reviewed by mentor")
      return
    }

    setEditingLog(log)
    setIsLogModalOpen(true)
  }

  const handleDeleteLog = (log: Log) => {
    // Only allow deleting if not approved yet
    if (log.mentor_approved !== null) {
      toast.error("Cannot delete logs that have been reviewed by mentor")
      return
    }

    setLogToDelete(log)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteLog = async () => {
    if (!logToDelete) return

    try {
      setIsDeleting(true)
      const { error } = await supabase.from("logs").delete().eq("id", logToDelete.id)

      if (error) throw error

      toast.success("Log deleted successfully")

      // Update local state
      setLogs((prev) => prev.filter((log) => log.id !== logToDelete.id))
    } catch (error) {
      console.error("Error deleting log:", error)
      toast.error("Failed to delete log")
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
      setLogToDelete(null)
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Logs</h1>
          <p className="text-muted-foreground">Track your daily work progress</p>
        </div>
        <Button
          onClick={() => {
            setEditingLog(null)
            setIsLogModalOpen(true)
          }}
        >
          Log Work
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Work Logs</CardTitle>
          <CardDescription>Record of your daily tasks and progress</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No work logs found. Start logging your work!</div>
          ) : (
            <div className="space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="text-lg font-medium">{formatDate(log.date)}</div>
                      <div className="ml-3">
                        {log.mentor_approved === true ? (
                          <div className="flex items-center text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </div>
                        ) : log.mentor_approved === false ? (
                          <div className="flex items-center text-red-600 text-xs bg-red-50 px-2 py-1 rounded-full">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejected
                          </div>
                        ) : (
                          <div className="flex items-center text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded-full">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </div>
                        )}
                      </div>
                    </div>
                    {log.mentor_approved === null && (
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditLog(log)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteLog(log)}>
                          <XCircle className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Expected Work</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{log.expected_task}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Completed Work</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{log.completed_task}</p>
                    </div>
                  </div>

                  {log.comments && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="text-sm font-medium mb-2">Mentor Comments</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{log.comments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Log Modal */}
      <WorkLogModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false)
          setEditingLog(null)
        }}
        onSuccess={fetchLogs}
        editLog={
          editingLog
            ? {
                id: editingLog.id,
                date: editingLog.date,
                expected_task: editingLog.expected_task,
                completed_task: editingLog.completed_task,
              }
            : null
        }
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteLog}
        title="Delete Work Log"
        message="Are you sure you want to delete this work log? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  )
}
