import React, { useState, useEffect } from 'react'
import NoteCard from './NoteCard'
import NoteModal from './NoteModal'
import ContextMenu from './ContextMenu'
import { loadNotesByProject, createNote, updateNote, deleteNote } from '../utils/storage'

const ProjectNotes = ({ project, onBack }) => {
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotes()
  }, [project.id])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault()
        handleAddNote()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const loadNotes = async () => {
    try {
      setLoading(true)
      console.log('Loading notes for project:', project.id)
      const loadedNotes = await loadNotesByProject(project.id)
      console.log('Loaded notes:', loadedNotes)
      setNotes(loadedNotes)
    } catch (error) {
      console.error('Failed to load notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = () => {
    const newNote = {
      id: Date.now().toString(),
      projectId: project.id,
      title: '',
      content: '',
      plainText: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setSelectedNote(newNote)
    setShowModal(true)
  }

  const handleSaveNote = async (note) => {
    try {
      const isNewNote = !notes.find(n => n.id === note.id)
      
      if (isNewNote) {
        await createNote(note)
      } else {
        await updateNote(note)
      }
      
      await loadNotes()
      setShowModal(false)
      setSelectedNote(null)
    } catch (error) {
      console.error('Failed to save note:', error)
      alert('Failed to save note')
    }
  }

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId)
      await loadNotes()
    } catch (error) {
      console.error('Failed to delete note:', error)
      alert('Failed to delete note')
    }
  }

  return (
    <div className="container mx-auto p-8">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        ← Back to Steps
      </button>
      
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">{project.name} - Notes</h1>
      
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading notes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => {
                setSelectedNote(note)
                setShowModal(true)
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  noteId: note.id
                })
              }}
            />
          ))}
          
          {/* Add new note card */}
          <div
            onClick={handleAddNote}
            className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-6 cursor-pointer 
                     hover:bg-gray-200 dark:hover:bg-gray-600 transform hover:scale-102 
                     transition-all duration-200 border-2 border-dashed border-gray-300 
                     dark:border-gray-500 flex items-center justify-center min-h-[200px]"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">+</div>
              <p className="text-gray-600 dark:text-gray-400">Add New Note</p>
            </div>
          </div>
        </div>
      )}
      
      {showModal && (
        <NoteModal
          note={selectedNote}
          onClose={() => {
            setShowModal(false)
            setSelectedNote(null)
          }}
          onSave={handleSaveNote}
        />
      )}
      
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: 'Delete Note',
              onClick: () => handleDeleteNote(contextMenu.noteId),
              danger: true
            }
          ]}
        />
      )}
    </div>
  )
}

export default ProjectNotes