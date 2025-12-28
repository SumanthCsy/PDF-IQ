"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { savePDFInfo } from "@/lib/firebase"

interface PDFUploadProps {
  onUploadComplete: (data: { url: string; pathname: string; contentType: string; size: number }) => void
}

export function PDFUpload({ onUploadComplete }: PDFUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { currentUser } = useAuth()

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file")
        return
      }

      setIsUploading(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const data = await response.json()
        
        // Store PDF information in Firestore if user is authenticated
        if (currentUser) {
          try {
            await savePDFInfo(currentUser.uid, {
              filename: file.name,
              url: data.url,
              pathname: data.pathname,
              contentType: data.contentType,
              size: data.size,
              uploadedAt: new Date(),
              userId: currentUser.uid
            })
          } catch (dbError) {
            console.error("Error saving PDF info to Firestore:", dbError)
            // We don't want to fail the upload just because of a DB error
          }
        }
        
        onUploadComplete(data)
      } catch (err) {
        console.error("[v0] Upload error:", err)
        setError("Failed to upload PDF. Please try again.")
      } finally {
        setIsUploading(false)
      }
    },
    [onUploadComplete],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile],
  )

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border/40 bg-card/30 hover:border-primary/50 hover:bg-card/50",
          isUploading && "pointer-events-none opacity-50",
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading your PDF...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Drop your PDF here</h3>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            </div>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button variant="outline" className="pointer-events-none bg-transparent">
              <FileText className="h-4 w-4 mr-2" />
              Select PDF File
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
