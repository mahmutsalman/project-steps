import React, { useState, useEffect, useRef } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

const StepModal = ({ step, onClose, onSave }) => {
  const [title, setTitle] = useState(step.title)
  const [description, setDescription] = useState(step.description || '')
  const [isDescriptionView, setIsDescriptionView] = useState(false)
  const quillRef = useRef(null)

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
  }

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

  useEffect(() => {
    const handleKeyDown = (event) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl p-8 w-full mx-4 shadow-2xl ${isDescriptionView ? 'max-w-4xl h-[80vh]' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isDescriptionView ? 'Edit Description' : 'Edit Step'}
          </h2>
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
        
        {isDescriptionView ? (
          <div className="flex flex-col" style={{ height: 'calc(80vh - 200px)' }}>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden" style={{ height: 'calc(100% - 30px)' }}>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={description}
                  onChange={setDescription}
                  modules={modules}
                  placeholder="Detailed text about the current steps..."
                  style={{ height: '100%' }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={description}
                  onChange={setDescription}
                  modules={modules}
                  placeholder="Detailed text about the current steps..."
                  className="h-32"
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 bg-cyan-500 text-white py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default StepModal