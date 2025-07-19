import React, { useEffect, useRef } from 'react'

const ContextMenu = ({ x, y, onClose, items }) => {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-50"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.divider ? (
            <hr className="my-1 border-gray-200 dark:border-gray-600" />
          ) : (
            <button
              onClick={() => {
                item.onClick()
                onClose()
              }}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                item.danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900' : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              {item.label}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default ContextMenu