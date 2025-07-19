import React, { useState, useEffect } from 'react'

const InputModal = ({ isOpen, onClose, onSubmit, title, placeholder, submitLabel = "Create", initialValue = "" }) => {
  const [value, setValue] = useState(initialValue)

  // Update value when initialValue changes (for rename modal)
  useEffect(() => {
    console.log('InputModal useEffect: initialValue changed to:', initialValue)
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    console.log('InputModal opened with isOpen:', isOpen, 'initialValue:', initialValue)
  }, [isOpen, initialValue])

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('InputModal handleSubmit called with value:', value)
    if (value.trim()) {
      console.log('Calling onSubmit with:', value.trim())
      onSubmit(value.trim())
      setValue('')
      onClose()
    } else {
      console.log('Value is empty, not submitting')
    }
  }

  const handleCancel = () => {
    setValue('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            autoFocus
          />
          
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-cyan-500 text-white py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors"
            >
              {submitLabel}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InputModal