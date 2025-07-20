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
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 cursor-pointer 
                 hover:shadow-xl transform hover:scale-102 transition-all duration-200
                 border-2 border-dashed ${
                   note.isImportant 
                     ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' 
                     : 'border-gray-300 dark:border-gray-600'
                 }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
          {note.title || 'Untitled Note'}
        </h3>
        {note.isImportant && (
          <svg className="w-5 h-5 text-orange-500 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
      </div>
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