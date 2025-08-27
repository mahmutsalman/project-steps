import React, { useState, useRef, useEffect } from 'react'

const SortDropdown = ({ currentSort, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const sortOptions = [
    {
      id: 'created_date_desc',
      label: 'Newest First',
      icon: '📅',
      description: 'Created date (newest to oldest)'
    },
    {
      id: 'created_date_asc',
      label: 'Oldest First',
      icon: '📅',
      description: 'Created date (oldest to newest)'
    },
    {
      id: 'updated_date_desc',
      label: 'Recently Updated',
      icon: '✏️',
      description: 'Last update (most recent first)'
    },
    {
      id: 'updated_date_asc',
      label: 'Least Recently Updated',
      icon: '✏️',
      description: 'Last update (oldest first)'
    },
    {
      id: 'recency_desc',
      label: 'Most Active',
      icon: '⚡',
      description: 'Last activity (most recent first)'
    },
    {
      id: 'recency_asc',
      label: 'Least Active',
      icon: '⚡',
      description: 'Last activity (oldest first)'
    },
    {
      id: 'name_asc',
      label: 'A to Z',
      icon: '🔤',
      description: 'Project name (alphabetical)'
    },
    {
      id: 'name_desc',
      label: 'Z to A',
      icon: '🔤',
      description: 'Project name (reverse alphabetical)'
    }
  ]

  const currentOption = sortOptions.find(option => option.id === currentSort) || sortOptions[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleOptionSelect = (option) => {
    onSortChange(option.id)
    setIsOpen(false)
  }

  const handleKeyDown = (event, option) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleOptionSelect(option)
    }
  }

  const handleToggleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen(!isOpen)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleToggleKeyDown}
        className="inline-flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 min-w-[200px]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Sort projects by"
      >
        <div className="flex items-center space-x-2">
          <span className="text-base" role="img" aria-hidden="true">
            {currentOption.icon}
          </span>
          <span className="truncate">{currentOption.label}</span>
        </div>
        <svg
          className={`w-5 h-5 ml-2 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 z-50 w-80 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
          role="listbox"
          aria-label="Sort options"
        >
          <div className="py-2">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                onKeyDown={(e) => handleKeyDown(e, option)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 transition-colors duration-150 ${
                  currentSort === option.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                role="option"
                aria-selected={currentSort === option.id}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-lg flex-shrink-0 mt-0.5" role="img" aria-hidden="true">
                    {option.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{option.label}</span>
                      {currentSort === option.id && (
                        <svg
                          className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SortDropdown