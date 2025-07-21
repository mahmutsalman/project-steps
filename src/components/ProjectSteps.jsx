import React, { useState, useEffect } from 'react'
import StepModal from './StepModal'
import NoteModal from './NoteModal'
import ContextMenu from './ContextMenu'
import ConfirmationModal from './ConfirmationModal'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { createStep, updateStep, updateProjectCurrentStep, deleteStep, getImportantNote, setImportantNote, createNote, updateNote, loadSteps } from '../utils/storage'
import { undoRedoSystem, DeleteStepCommand } from '../utils/undoRedoSystem'

const ProjectSteps = ({ project, steps, onBack, onUpdateSteps, allSteps, onUpdateProject, onNavigateToNotes }) => {
  const [selectedStep, setSelectedStep] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [localSteps, setLocalSteps] = useState(steps)
  const [contextMenu, setContextMenu] = useState(null)
  const [headerContextMenu, setHeaderContextMenu] = useState(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [importantNote, setImportantNoteState] = useState(null)
  const [lastOpenedStepId, setLastOpenedStepId] = useState(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [stepToDelete, setStepToDelete] = useState(null)

  // Functions to manage last opened step in localStorage
  const getLastOpenedStepId = (projectId) => {
    try {
      return localStorage.getItem(`lastOpenedStep_${projectId}`)
    } catch (error) {
      console.error('Error reading last opened step from localStorage:', error)
      return null
    }
  }

  const saveLastOpenedStepId = (projectId, stepId) => {
    try {
      if (stepId) {
        localStorage.setItem(`lastOpenedStep_${projectId}`, stepId)
      } else {
        localStorage.removeItem(`lastOpenedStep_${projectId}`)
      }
    } catch (error) {
      console.error('Error saving last opened step to localStorage:', error)
    }
  }

  // Extract preview text (first 2-3 sentences)
  const getPreviewText = (step) => {
    let textContent = step.plainText
    
    // Fallback: extract plain text from HTML description if plainText is missing
    if (!textContent && step.description) {
      // Create a temporary element to strip HTML tags
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = step.description
      textContent = tempDiv.textContent || tempDiv.innerText || ''
    }
    
    if (!textContent) return ''
    
    // Split by periods and take first 2-3 sentences
    const sentences = textContent.split(/[.!?]+/)
    const preview = sentences.slice(0, 3).join('. ')
    
    // Limit to 150 characters
    if (preview.length > 150) {
      return preview.substring(0, 147) + '...'
    }
    
    return preview + (sentences.length > 3 ? '...' : '')
  }

  useEffect(() => {
    setLocalSteps(steps)
  }, [steps])

  // Load last opened step from localStorage when project changes
  useEffect(() => {
    const savedLastOpenedStepId = getLastOpenedStepId(project.id)
    setLastOpenedStepId(savedLastOpenedStepId)
  }, [project.id])

  useEffect(() => {
    const loadImportantNote = async () => {
      try {
        const note = await getImportantNote(project.id)
        setImportantNoteState(note)
      } catch (error) {
        console.error('Failed to load important note:', error)
      }
    }
    loadImportantNote()
  }, [project.id])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault()
        handleAddStep()
      } else if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        event.preventDefault()
        handleUndo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [localSteps])

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(localSteps)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const updatedSteps = items.map((step, index) => ({
      ...step,
      order: index
    }))

    setLocalSteps(updatedSteps)
    
    const otherSteps = allSteps.filter(s => s.projectId !== project.id)
    onUpdateSteps([...otherSteps, ...updatedSteps])
  }

  const handleStepClick = async (step, event) => {
    if (event.metaKey || event.ctrlKey) {
      // Cmd+click or Ctrl+click to toggle highlight
      event.preventDefault()
      event.stopPropagation()
      const newCurrentStepId = project.currentStepId === step.id ? null : step.id
      await updateProjectCurrentStep(project.id, newCurrentStepId)
      onUpdateProject({ ...project, currentStepId: newCurrentStepId })
    } else {
      // Regular click to open modal
      setSelectedStep(step)
      setShowModal(true)
      // Track this as the last opened step
      setLastOpenedStepId(step.id)
      saveLastOpenedStepId(project.id, step.id)
    }
  }

  const handleAddStep = async () => {
    const newStep = {
      id: Date.now().toString(),
      projectId: project.id,
      title: `Step ${localSteps.length + 1}`,
      description: 'Click to edit this step',
      order: localSteps.length,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    try {
      await createStep(newStep)
      const updatedSteps = [...localSteps, newStep]
      setLocalSteps(updatedSteps)
      
      const otherSteps = allSteps.filter(s => s.projectId !== project.id)
      onUpdateSteps([...otherSteps, ...updatedSteps])
    } catch (error) {
      console.error('Failed to create step:', error)
      alert('Failed to create step')
    }
  }

  const handleUpdateStep = async (updatedStep) => {
    try {
      await updateStep(updatedStep)
      const updatedLocalSteps = localSteps.map(s => 
        s.id === updatedStep.id ? updatedStep : s
      )
      setLocalSteps(updatedLocalSteps)
      
      const otherSteps = allSteps.filter(s => s.projectId !== project.id)
      onUpdateSteps([...otherSteps, ...updatedLocalSteps])
    } catch (error) {
      console.error('Failed to update step:', error)
      alert('Failed to update step')
    }
  }

  const handleDeleteStepRequest = (step) => {
    setStepToDelete(step)
    setShowDeleteConfirmation(true)
    setContextMenu(null) // Close context menu
  }

  const handleConfirmDeleteStep = async () => {
    if (!stepToDelete) return

    const deleteCommand = new DeleteStepCommand(
      stepToDelete,
      project.id,
      deleteStep,
      createStep
    )
    
    try {
      await undoRedoSystem.executeCommand(deleteCommand)
      
      // Reload steps from database to ensure consistency
      const freshSteps = await loadSteps()
      setLocalSteps(freshSteps.filter(s => s.projectId === project.id))
      onUpdateSteps(freshSteps)
      
      setShowDeleteConfirmation(false)
      setStepToDelete(null)
    } catch (error) {
      console.error('Failed to delete step:', error)
      alert('Failed to delete step')
      setShowDeleteConfirmation(false)
      setStepToDelete(null)
    }
  }

  const handleCancelDeleteStep = () => {
    setShowDeleteConfirmation(false)
    setStepToDelete(null)
  }

  const handleUndo = async () => {
    try {
      const success = await undoRedoSystem.undo()
      if (success) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to undo:', error)
      alert('Failed to undo action')
    }
  }

  const handleImportantNoteClick = () => {
    if (importantNote) {
      setShowNoteModal(true)
    } else {
      // Create a new important note
      const newNote = {
        id: Date.now().toString(),
        projectId: project.id,
        title: 'Important Note',
        content: '',
        plainText: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isImportant: true
      }
      setImportantNoteState(newNote)
      setShowNoteModal(true)
    }
  }

  const handleSaveImportantNote = async (updatedNote) => {
    try {
      if (importantNote) {
        // Update existing note
        await updateNote(updatedNote)
      } else {
        // Create new note and set as important
        await createNote(updatedNote)
        await setImportantNote(project.id, updatedNote.id)
      }
      setImportantNoteState(updatedNote)
      setShowNoteModal(false)
    } catch (error) {
      console.error('Failed to save important note:', error)
      alert('Failed to save important note')
    }
  }

  const handleAutoSaveImportantNote = async (updatedNote) => {
    try {
      if (importantNote) {
        // Update existing note
        await updateNote(updatedNote)
      } else {
        // Create new note and set as important
        await createNote(updatedNote)
        await setImportantNote(project.id, updatedNote.id)
      }
      setImportantNoteState(updatedNote)
      // Don't close modal for auto-save
    } catch (error) {
      console.error('Failed to auto-save important note:', error)
    }
  }

  const handleSwipeRight = async (step) => {
    const updatedStep = { ...step, completed: true }
    await handleUpdateStep(updatedStep)
  }

  const handleSwipeLeft = async (step) => {
    const updatedStep = { ...step, completed: false }
    await handleUpdateStep(updatedStep)
  }

  const StepItem = ({ step, provided, snapshot, index, isLastOpened }) => {
    const [startX, setStartX] = useState(null)
    const [currentX, setCurrentX] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    
    const handleMouseDown = (e) => {
      e.stopPropagation()
      setStartX(e.clientX)
      setIsDragging(false)
    }
    
    const handleMouseMove = (e) => {
      if (startX !== null) {
        e.stopPropagation()
        setCurrentX(e.clientX)
        const distance = Math.abs(e.clientX - startX)
        if (distance > 10) {
          setIsDragging(true)
        }
      }
    }
    
    const handleMouseUp = (e) => {
      e.stopPropagation()
      if (startX !== null) {
        const endX = e.clientX
        const distance = endX - startX
        const threshold = 50 // Minimum distance for a swipe
        
        if (Math.abs(distance) > threshold) {
          // It's a swipe
          if (distance > 0) {
            handleSwipeRight(step)
          } else {
            handleSwipeLeft(step)
          }
        } else if (!isDragging) {
          // It's a click
          handleStepClick(step, e)
        }
      }
      
      // Reset state
      setStartX(null)
      setCurrentX(null)
      setIsDragging(false)
    }
    
    const handleMouseLeave = () => {
      // Reset state if mouse leaves the element
      setStartX(null)
      setCurrentX(null)
      setIsDragging(false)
    }
    
    // Calculate visual offset for swipe feedback
    const offset = startX !== null && currentX !== null ? currentX - startX : 0
    const opacity = startX !== null && currentX !== null ? 1 - Math.abs(offset) / 200 : 1

    // Create a wrapper div for swipe functionality
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        style={{
          ...provided.draggableProps.style,
          transform: snapshot.isDragging 
            ? provided.draggableProps.style?.transform 
            : `translateX(${offset}px)`,
          opacity: opacity,
          transition: startX === null ? 'all 0.3s ease' : 'none'
        }}
      >
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={(e) => {
            e.preventDefault()
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              step: step
            })
          }}
          className={`${
            step.completed
              ? 'bg-green-500'
              : project.currentStepId === step.id 
                ? 'bg-red-500' 
                : 'bg-cyan-500'
          } text-white p-6 rounded-2xl cursor-pointer transform transition-all ${
            snapshot.isDragging ? 'rotate-2 scale-105' : 'hover:scale-102'
          } shadow-lg relative overflow-hidden select-none ${
            isLastOpened ? 'ring-8 ring-indigo-500 shadow-indigo-500 shadow-2xl border-4 border-indigo-500' : ''
          }`}
        >
          <div {...provided.dragHandleProps} className="absolute top-2 left-2 cursor-move">
            <svg className="w-6 h-6 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            {step.title}
            {isLastOpened && (
              <span className="text-xs bg-blue-600 bg-opacity-80 px-2 py-1 rounded-full">
                Last opened
              </span>
            )}
          </h3>
          <p className={
            step.completed 
              ? "text-green-100" 
              : project.currentStepId === step.id 
                ? "text-red-100" 
                : "text-cyan-100"
          }>{getPreviewText(step)}</p>
          {step.completed && (
            <div className="absolute top-2 right-2">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ← Back to Projects
          </button>
          
          <button
            onClick={handleImportantNoteClick}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-lg flex items-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="hidden sm:inline">Important Note</span>
            <span className="sm:hidden">Important</span>
          </button>
        </div>
        
        {/* Spacer div to push content away from dark mode toggle */}
        <div className="hidden sm:block sm:w-16"></div>
      </div>
      
      <h1 
        className="text-3xl font-bold mb-8 text-gray-900 dark:text-white cursor-context-menu"
        onContextMenu={(e) => {
          e.preventDefault()
          setHeaderContextMenu({
            x: e.clientX,
            y: e.clientY
          })
        }}
      >
        {project.name} - Steps
      </h1>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="steps">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {localSteps.sort((a, b) => a.order - b.order).map((step, index) => (
                <Draggable key={step.id} draggableId={step.id} index={index}>
                  {(provided, snapshot) => (
                    <StepItem 
                      step={step} 
                      provided={provided} 
                      snapshot={snapshot} 
                      index={index} 
                      isLastOpened={step.id === lastOpenedStepId}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      <button
        onClick={handleAddStep}
        className="mt-6 w-full bg-yellow-500 text-white p-6 rounded-2xl font-bold text-2xl hover:bg-yellow-600 transition-colors shadow-lg"
      >
        +
      </button>
      
      {showModal && (
        <StepModal
          step={selectedStep}
          onClose={() => setShowModal(false)}
          onSave={(updatedStep) => {
            handleUpdateStep(updatedStep)
            setShowModal(false)
          }}
          onAutoSave={(updatedStep) => {
            handleUpdateStep(updatedStep)
          }}
        />
      )}
      
      {showNoteModal && (
        <NoteModal
          note={importantNote}
          onClose={() => setShowNoteModal(false)}
          onSave={handleSaveImportantNote}
          onAutoSave={handleAutoSaveImportantNote}
        />
      )}
      
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: 'Delete Step',
              onClick: () => handleDeleteStepRequest(contextMenu.step),
              danger: true
            }
          ]}
        />
      )}
      
      {headerContextMenu && (
        <ContextMenu
          x={headerContextMenu.x}
          y={headerContextMenu.y}
          onClose={() => setHeaderContextMenu(null)}
          items={[
            {
              label: 'Notes',
              onClick: () => onNavigateToNotes()
            }
          ]}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={handleCancelDeleteStep}
        onConfirm={handleConfirmDeleteStep}
        title="Delete Step"
        message={`Are you sure you want to delete "${stepToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  )
}

export default ProjectSteps