"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/ui/modal"
import { Loader2 } from "lucide-react"

interface WorkLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editLog?: {
    id: number
    date: string
    expected_task: string
    completed_task: string
  } | null
}

export function WorkLogModal({ isOpen, onClose, onSuccess, editLog }: WorkLogModalProps) {
  const [date, setDate] = useState(editLog?.date || new Date().toISOString().split("T")[0])
  const [expectedTask, setExpectedTask] = useState(editLog?.expected_task || "")
  const [completedTask, setCompletedTask] = useState(editLog?.completed_task || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date) {
      toast.error("Please select a date")
      return
    }

    if (!expectedTask.trim()) {
      toast.error("Please enter expected work")
      return
    }

    if (!completedTask.trim()) {
      toast.error("Please enter completed work")
      return
    }

    try {
      setIsSubmitting(true)

      // Get student ID from session storage
      const studentData = sessionStorage.getItem("studentData")
      if (!studentData) {
        throw new Error("No student data found")
      }

      const student = JSON.parse(studentData)
      if (!student.student_id) {
        throw new Error("Student ID not found")
      }

      if (editLog) {
        // Update existing log
        const { error } = await supabase
          .from("logs")
          .update({
            date,
            expected_task: expectedTask,
            completed_task: completedTask,
          })
          .eq("id", editLog.id)

        if (error) throw error

        toast.success("Work log updated successfully")
      } else {
        // Create new log
        const { error } = await supabase.from("logs").insert([
          {
            student_id: student.student_id,
            date,
            expected_task: expectedTask,
            completed_task: completedTask,
            mentor_approved: null,
            team_id: student.team_id,
          },
        ])

        if (error) throw error

        toast.success("Work logged successfully")
      }

      // Reset form and close modal
      setDate(new Date().toISOString().split("T")[0])
      setExpectedTask("")
      setCompletedTask("")

      if (onSuccess) {
        onSuccess()
      }

      onClose()
    } catch (error) {
      console.error("Error logging work:", error)
      toast.error("Failed to log work")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editLog ? "Edit Work Log" : "Log Work"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedTask">Expected Work</Label>
          <Textarea
            id="expectedTask"
            value={expectedTask}
            onChange={(e) => setExpectedTask(e.target.value)}
            placeholder="What did you plan to work on?"
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="completedTask">Completed Work</Label>
          <Textarea
            id="completedTask"
            value={completedTask}
            onChange={(e) => setCompletedTask(e.target.value)}
            placeholder="What did you actually complete?"
            rows={3}
            required
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editLog ? "Updating..." : "Submitting..."}
              </>
            ) : editLog ? (
              "Update Log"
            ) : (
              "Submit Log"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
