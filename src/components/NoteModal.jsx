import React, { useState, useRef, useEffect } from 'react'
import QuillWithImages from './QuillWithImages'
import 'react-quill-new/dist/quill.snow.css'

const NoteModal = ({ note, onClose, onSave, onAutoSave }) => {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const quillRef = useRef(null)

  // Auto-save on content change
  useEffect(() => {
    if (title !== (note?.title || '') || content !== (note?.content || '')) {
      const timeoutId = setTimeout(() => {
        autoSave()
      }, 2000) // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId)
    }
  }, [title, content])

  // Auto-save before component unmounts
  useEffect(() => {
    return () => {
      if (title !== (note?.title || '') || content !== (note?.content || '')) {
        autoSave()
      }
    }
  }, [])

  // Disable body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Auto-save on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (title !== (note?.title || '') || content !== (note?.content || '')) {
          autoSave()
        }
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [title, content, onClose])

  const handleSave = () => {
    // Get plain text from Quill editor
    const plainText = quillRef.current?.getEditor()?.getText() || ''
    
    const updatedNote = {
      ...note,
      title: title || 'Untitled Note',
      content: content,
      plainText: plainText.trim(),
      updatedAt: new Date().toISOString()
    }
    
    onSave(updatedNote)
  }

  const autoSave = () => {
    // Get plain text from Quill editor
    const plainText = quillRef.current?.getEditor()?.getText() || ''
    
    const updatedNote = {
      ...note,
      title: title || 'Untitled Note',
      content: content,
      plainText: plainText.trim(),
      updatedAt: new Date().toISOString()
    }
    
    if (onAutoSave) {
      onAutoSave(updatedNote)
    }
  }

  const modules = {
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className={`relative bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-4 rounded-lg' 
          : 'rounded-2xl max-w-4xl w-full max-h-[90vh]'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
            className="flex-1 text-2xl font-bold bg-transparent border-none outline-none 
                     text-gray-900 dark:text-white placeholder-gray-400"
          />
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="ml-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
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
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-6">
          <QuillWithImages
            ref={quillRef}
            value={content}
            onChange={setContent}
            contentId={note?.id}
            contentTypeEnum="note"
            modules={modules}
            placeholder="Start writing your note..."
            className={`h-full ${isFullscreen ? 'min-h-[calc(100vh-300px)]' : 'min-h-[400px]'}`}
          />
        </div>


        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 
                     dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                     transition-colors shadow-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default NoteModal