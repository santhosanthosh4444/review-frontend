"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Link, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadToImageKit } from "@/lib/imagekit"

interface FileUploadProps {
  onUploadComplete: (name: string, url: string) => void
  onCancel: () => void
}

export function FileUpload({ onUploadComplete, onCancel }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [link, setLink] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadType, setUploadType] = useState<"file" | "link">("file")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (uploadType === "file") {
      if (!file) {
        alert("Please select a file")
        return
      }

      if (!displayName) {
        alert("Please enter a display name for the file")
        return
      }

      try {
        setIsUploading(true)
        const fileName = `${Date.now()}-${file.name}`
        const url = await uploadToImageKit(file, fileName)
        onUploadComplete(displayName, url)
      } catch (error) {
        console.error("Upload failed:", error)
        alert("Failed to upload file. Please try again.")
      } finally {
        setIsUploading(false)
      }
    } else {
      // Link upload
      if (!link) {
        alert("Please enter a link")
        return
      }

      if (!displayName) {
        alert("Please enter a display name for the link")
        return
      }

      onUploadComplete(displayName, link)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-2 mb-4">
        <Button
          type="button"
          variant={uploadType === "file" ? "default" : "outline"}
          onClick={() => setUploadType("file")}
          className="flex-1"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
        <Button
          type="button"
          variant={uploadType === "link" ? "default" : "outline"}
          onClick={() => setUploadType("link")}
          className="flex-1"
        >
          <Link className="mr-2 h-4 w-4" />
          Add Link
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter a name for this attachment"
            required
          />
        </div>

        {uploadType === "file" ? (
          <div
            className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">
              {file ? file.name : "Drag and drop a file here, or click to select"}
            </p>
            {file && <p className="text-xs text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="link">Link URL</Label>
            <Input
              id="link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com/document.pdf"
              required
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Add Attachment"
          )}
        </Button>
      </div>
    </form>
  )
}
