import React from 'react'

const ProjectNotes = ({ project, onBack }) => {
  return (
    <div className="container mx-auto p-8">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        ← Back to Steps
      </button>
      
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">{project.name} - Notes</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Notes feature coming soon...
        </p>
      </div>
    </div>
  )
}

export default ProjectNotes