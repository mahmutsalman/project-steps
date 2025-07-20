import React, { useState, useEffect } from 'react'
import { convertImageToBase64 } from '../utils/imageUtils'

const ThumbnailModal = ({ attachments, initialIndex, onClose, onDelete }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [imageDataUrls, setImageDataUrls] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadImages()
  }, [attachments])

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          event.preventDefault()
          navigatePrevious()
          break
        case 'ArrowRight':
          event.preventDefault()
          navigateNext()
          break
        case 'Delete':
        case 'Backspace':
          event.preventDefault()
          handleDelete()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, attachments])

  const loadImages = async () => {
    setLoading(true)
    const newImageDataUrls = {}
    
    for (const attachment of attachments) {
      try {
        const base64 = await convertImageToBase64(attachment.filePath)
        newImageDataUrls[attachment.id] = `data:${attachment.contentType};base64,${base64}`
      } catch (error) {
        console.error('Error loading image:', attachment.filename, error)
      }
    }
    
    setImageDataUrls(newImageDataUrls)
    setLoading(false)
  }

  const navigatePrevious = () => {
    if (attachments.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + attachments.length) % attachments.length)
    }
  }

  const navigateNext = () => {
    if (attachments.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % attachments.length)
    }
  }

  const handleDelete = () => {
    const currentAttachment = attachments[currentIndex]
    if (currentAttachment) {
      // If there are more images, navigate to the next one before deleting
      if (attachments.length > 1) {
        const nextIndex = currentIndex < attachments.length - 1 ? currentIndex : currentIndex - 1
        setCurrentIndex(nextIndex)
      }
      
      onDelete(currentAttachment)
      
      // If this was the last image, close the modal
      if (attachments.length <= 1) {
        onClose()
      }
    }
  }

  const currentAttachment = attachments[currentIndex]
  const currentImageUrl = currentAttachment ? imageDataUrls[currentAttachment.id] : null

  if (!currentAttachment) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-[100]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full h-full flex flex-col">
        {/* Top Header Bar */}
        <div className="relative bg-gray-900 bg-opacity-80 p-4 flex justify-between items-center">
          <div className="text-white">
            <span className="text-lg font-medium">
              {currentIndex + 1} of {attachments.length}
            </span>
            {attachments.length > 1 && (
              <span className="text-sm text-gray-300 ml-3">
                Use ← → to navigate
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            {/* Delete button */}
            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              title="Delete image (Del/Backspace)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              title="Close (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center p-8">
          {loading ? (
            <div className="bg-gray-800 rounded-lg p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt={currentAttachment.filename}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          ) : (
            <div className="bg-gray-800 text-white p-8 rounded-lg">
              <p>Error loading image</p>
            </div>
          )}
        </div>

        {/* Navigation arrows (only show if more than one image) */}
        {attachments.length > 1 && (
          <>
            {/* Previous button */}
            <button
              onClick={navigatePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
              title="Previous image (←)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next button */}
            <button
              onClick={navigateNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
              title="Next image (→)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Footer with image info */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-black bg-opacity-50 text-white p-3 rounded-lg">
            <p className="text-sm font-medium truncate">{currentAttachment.filename}</p>
            <p className="text-xs text-gray-300">
              {currentAttachment.contentType} • {new Date(currentAttachment.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThumbnailModal