"use client"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}: ConfirmationDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex items-start space-x-4 mb-4">
        <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? "Processing..." : confirmText}
        </Button>
      </div>
    </Modal>
  )
}
