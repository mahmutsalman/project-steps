import React, { useState, useEffect } from 'react'
import { createImageThumbnail } from '../utils/imageUtils'
import ThumbnailModal from './ThumbnailModal'

const ImageThumbnails = ({ attachments, onDelete, compact = false }) => {
  const [thumbnails, setThumbnails] = useState({})
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)

  useEffect(() => {
    loadThumbnails()
  }, [attachments])

  const loadThumbnails = async () => {
    const newThumbnails = {}
    
    for (const attachment of attachments) {
      try {
        const thumbnail = await createImageThumbnail(attachment)
        newThumbnails[attachment.id] = thumbnail
      } catch (error) {
        console.error('Error creating thumbnail for', attachment.filename, error)
      }
    }
    
    setThumbnails(newThumbnails)
  }

  const handleThumbnailClick = (index) => {
    setSelectedImageIndex(index)
  }

  const handleCloseModal = () => {
    setSelectedImageIndex(null)
  }

  const handleDeleteFromModal = (attachment) => {
    onDelete(attachment)
    handleCloseModal()
  }

  if (attachments.length === 0) {
    return null
  }

  return (
    <>
      <div className="image-thumbnails relative z-20">
        <div className={`flex flex-wrap ${compact ? 'gap-1' : 'gap-2'}`}>
          {attachments.map((attachment, index) => {
            const thumbnail = thumbnails[attachment.id]
            
            return (
              <div
                key={attachment.id}
                className="relative group cursor-pointer z-30"
                style={{ pointerEvents: 'auto' }}
                onClick={() => handleThumbnailClick(index)}
              >
                <div className={`${compact ? 'w-12 h-12' : 'w-20 h-20'} rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 hover:border-cyan-500 transition-colors`}>
                  {thumbnail ? (
                    <img
                      src={thumbnail.dataUrl}
                      alt={attachment.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Delete button - shows on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(attachment)
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                  title="Delete image"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Filename tooltip */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {attachment.filename}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Full-size image modal */}
      {selectedImageIndex !== null && (
        <ThumbnailModal
          attachments={attachments}
          initialIndex={selectedImageIndex}
          onClose={handleCloseModal}
          onDelete={handleDeleteFromModal}
        />
      )}
    </>
  )
}

export default ImageThumbnails