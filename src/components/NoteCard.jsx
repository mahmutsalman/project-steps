import React from 'react'

const NoteCard = ({ note, onClick, onContextMenu }) => {
  // Extract preview text (first 2-3 sentences)
  const getPreviewText = (plainText) => {
    if (!plainText) return ''
    
    // Split by periods and take first 2-3 sentences
    const sentences = plainText.split(/[.!?]+/)
    const preview = sentences.slice(0, 3).join('. ')
    
    // Limit to 150 characters
    if (preview.length > 150) {
      return preview.substring(0, 147) + '...'
    }
    
    return preview + (sentences.length > 3 ? '...' : '')
  }

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 cursor-pointer 
                 hover:shadow-xl transform hover:scale-102 transition-all duration-200
                 border-2 border-dashed border-gray-300 dark:border-gray-600"
    >
      <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
        {note.title || 'Untitled Note'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
        {getPreviewText(note.plainText)}
      </p>
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
        {new Date(note.updatedAt).toLocaleDateString()}
      </div>
    </div>
  )
}

export default NoteCard