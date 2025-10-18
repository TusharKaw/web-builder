'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Image, File, Check } from 'lucide-react'

interface FileUploadProps {
  siteId: string
  pageId: string
  onFileUploaded?: (file: any) => void
}

interface UploadedFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

export default function FileUpload({ siteId, pageId, onFileUploaded }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFiles()
  }, [siteId, pageId])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sites/${siteId}/pages/${pageId}/mediawiki-files`)
      if (response.ok) {
        const mediawikiFiles = await response.json()
        setFiles(mediawikiFiles || [])
      }
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image. Only images are allowed.`)
        continue
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`)
        continue
      }

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('comment', `Uploaded via website builder`)

        console.log(`Uploading ${file.name} to MediaWiki...`)

        const response = await fetch(`/api/sites/${siteId}/pages/${pageId}/mediawiki-files`, {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          console.log('Upload successful:', result)
          
          // Refresh the file list
          await loadFiles()
          onFileUploaded?.(result)
          
          alert(`File ${file.name} uploaded successfully to MediaWiki!`)
        } else {
          const error = await response.json()
          console.error('Upload failed:', error)
          alert(`Failed to upload ${file.name}: ${error.error}`)
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert(`Failed to upload ${file.name}`)
      }
    }

    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <div className="flex items-center">
          <Upload className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold">File Upload</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Upload images to use in your pages
        </p>
      </div>

      <div className="p-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 mb-2">
            Drag and drop images here, or click to select
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading...' : 'Choose Files'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* MediaWiki Files */}
        {loading ? (
          <div className="mt-4 text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading files from MediaWiki...</p>
          </div>
        ) : files.length > 0 ? (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">MediaWiki Files</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file.mime || 'image/jpeg')}
                    <div>
                      <p className="text-sm font-medium">{file.title}</p>
                      <p className="text-xs text-gray-500">
                        {file.size ? formatFileSize(file.size) : 'MediaWiki file'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(`[[File:${file.title}]]`)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Copy Wiki Link
                    </button>
                    <button
                      onClick={() => copyToClipboard(`<img src="${file.url}" alt="${file.title}" />`)}
                      className="text-xs text-green-600 hover:text-green-800"
                    >
                      Copy HTML
                    </button>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:text-purple-800"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 text-center py-4 text-gray-500">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No files uploaded to MediaWiki yet</p>
            <p className="text-sm">Upload files to use them in your pages</p>
          </div>
        )}
      </div>
    </div>
  )
}
