import React, { useState, useEffect, useRef, useMemo } from 'react'
import QuillWithImages from './QuillWithImages'
import 'react-quill-new/dist/quill.snow.css'

const StepModal = ({ step, onClose, onSave, onAutoSave }) => {
  const [title, setTitle] = useState(step.title)
  const [description, setDescription] = useState(step.description || '')
  const [isDescriptionView, setIsDescriptionView] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasImages, setHasImages] = useState(false)
  const quillRef = useRef(null)

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      [{ 'size': ['small', 'normal', false, 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
  }), [])

  const formats = [
    'header', 'size', 'bold', 'italic', 'underline', 'strike',
    'list', 'blockquote', 'code-block', 'color', 'background', 'link'
  ]

  const handleSave = () => {
    const plainText = quillRef.current?.getEditor()?.getText() || ''
    onSave({
      ...step,
      title,
      description,
      plainText: plainText.trim(),
      updatedAt: new Date().toISOString()
    })
  }

  const autoSave = () => {
    const plainText = quillRef.current?.getEditor()?.getText() || ''
    if (onAutoSave) {
      onAutoSave({
        ...step,
        title,
        description,
        plainText: plainText.trim(),
        updatedAt: new Date().toISOString()
      })
    }
  }

  // Auto-save on content change
  useEffect(() => {
    if (title !== step.title || description !== step.description) {
      const timeoutId = setTimeout(() => {
        autoSave()
      }, 2000) // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId)
    }
  }, [title, description])

  // Auto-save before component unmounts
  useEffect(() => {
    return () => {
      if (title !== step.title || description !== step.description) {
        autoSave()
      }
    }
  }, [])

  // Check for image attachments periodically
  useEffect(() => {
    const checkImages = () => {
      if (quillRef.current?.getImageAttachments) {
        const attachments = quillRef.current.getImageAttachments()
        setHasImages(attachments && attachments.length > 0)
      }
    }

    // Check initially and then periodically
    const interval = setInterval(checkImages, 1000)
    checkImages()

    return () => clearInterval(interval)
  }, [description])

  // Disable body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Auto-save on Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (title !== step.title || description !== step.description) {
          autoSave()
        }
        onClose()
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'w') {
        event.preventDefault()
        handleSave()
        onClose()
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        handleSave()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [title, description])

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div 
        className={`bg-white dark:bg-gray-800 p-8 shadow-2xl transition-all duration-300 overflow-hidden ${
          isFullscreen 
            ? 'fixed inset-4 rounded-lg w-auto h-auto' 
            : `mx-4 rounded-2xl w-full ${isDescriptionView ? 'max-w-4xl h-[80vh]' : 'max-w-2xl max-h-[80vh]'}`
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isDescriptionView ? 'Edit Description' : 'Edit Step'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isFullscreen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l6 6m0-6l-6 6M15 3h6v6M9 21H3v-6" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
                )}
              </svg>
            </button>
            <button
              onClick={() => setIsDescriptionView(!isDescriptionView)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isDescriptionView ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {isDescriptionView ? (
          <div className={`flex flex-col overflow-hidden ${isFullscreen ? 'h-[calc(100vh-240px)]' : 'h-[calc(80vh-240px)]'}`}>
            <div className="flex-1 mb-4 overflow-hidden">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
                {hasImages && (
                  <span className="flex items-center gap-1 text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Has images
                  </span>
                )}
              </label>
              <div 
                className="border border-gray-300 dark:border-gray-600 rounded-lg" 
                style={{ minHeight: '400px' }}
              >
                <QuillWithImages
                  ref={quillRef}
                  value={description}
                  onChange={setDescription}
                  contentId={step.id}
                  contentTypeEnum="step"
                  modules={modules}
                  formats={formats}
                  placeholder="Detailed text about the current steps..."
                  style={{ 
                    minHeight: '400px'
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className={`overflow-y-auto ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'max-h-[calc(80vh-250px)]'}`}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Step Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
                {hasImages && (
                  <span className="flex items-center gap-1 text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Has images
                  </span>
                )}
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
                <QuillWithImages
                  ref={quillRef}
                  value={description}
                  onChange={setDescription}
                  contentId={step.id}
                  contentTypeEnum="step"
                  modules={modules}
                  formats={formats}
                  placeholder="Detailed text about the current steps..."
                  style={{ 
                    minHeight: '300px'
                  }}
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex gap-4 relative z-10">
          <button
            onClick={handleSave}
            className="flex-1 bg-cyan-500 text-white py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors cursor-pointer"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default StepModal