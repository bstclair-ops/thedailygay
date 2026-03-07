'use client'

import { useRef, useState } from 'react'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      // Use API route instead of server action — server actions have a 1MB body limit
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Upload failed (${res.status})`)
      }

      const { url } = await res.json()
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  return (
    <div className="space-y-3">
      {/* Current image preview */}
      {value && (
        <div className="relative border border-dp-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Hero image preview"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-dp-surface border border-dp-border text-dp-text hover:bg-dp-text hover:text-dp-bg transition-colors text-xs px-2 py-1 font-sans uppercase tracking-wide"
          >
            Remove
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={[
          'border-2 border-dashed border-dp-border cursor-pointer p-8 text-center transition-colors',
          isLoading ? 'opacity-50 pointer-events-none' : 'hover:border-dp-text',
        ].join(' ')}
      >
        {isLoading ? (
          <div className="space-y-2">
            <div className="w-6 h-6 border-2 border-dp-text border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-sans text-xs text-dp-text-secondary uppercase tracking-wide">
              Uploading…
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="w-8 h-8 mx-auto text-dp-border"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="font-sans text-sm text-dp-text-secondary">
              {value ? 'Click or drag to replace image' : 'Click or drag to upload hero image'}
            </p>
            <p className="font-sans text-xs text-dp-border uppercase tracking-wide">
              JPEG, PNG, WebP — max 10 MB
            </p>
          </div>
        )}
      </div>

      {/* Or enter URL directly */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-dp-border" />
        <span className="font-sans text-xs text-dp-text-secondary uppercase tracking-wide">or enter URL</span>
        <div className="flex-1 h-px bg-dp-border" />
      </div>
      <input
        type="url"
        placeholder="https://example.com/image.jpg"
        defaultValue={value?.startsWith('http') ? value : ''}
        onBlur={(e) => {
          if (e.target.value) onChange(e.target.value)
        }}
        className="w-full border border-dp-border px-3 py-2 font-sans text-sm focus:outline-none focus:border-dp-text bg-dp-surface text-dp-text"
      />

      {/* Error */}
      {error && (
        <p className="font-sans text-xs text-dp-red">{error}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
