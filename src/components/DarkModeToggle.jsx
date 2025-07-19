import React from 'react'
import { useDarkMode } from '../contexts/DarkModeContext'

const DarkModeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <div className="fixed top-6 right-6 z-40">
      <button
        onClick={toggleDarkMode}
        className={`relative inline-flex h-12 w-20 items-center rounded-full border-2 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-gray-200 border-gray-300'
        }`}
        aria-label="Toggle dark mode"
      >
        {/* Toggle Circle */}
        <span
          className={`inline-block h-8 w-8 transform rounded-full transition-all duration-300 flex items-center justify-center ${
            isDarkMode 
              ? 'translate-x-10 bg-yellow-400' 
              : 'translate-x-1 bg-white shadow-lg'
          }`}
        >
          {/* Icon */}
          {isDarkMode ? (
            // Moon icon
            <svg 
              className="w-4 h-4 text-gray-800" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          ) : (
            // Sun icon
            <svg 
              className="w-4 h-4 text-yellow-500" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" 
                clipRule="evenodd" 
              />
            </svg>
          )}
        </span>
      </button>
    </div>
  )
}

export default DarkModeToggle