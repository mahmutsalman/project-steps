import React, { useState, useEffect } from 'react'
import StepModal from './StepModal'
import ContextMenu from './ContextMenu'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { createStep, updateStep, updateProjectCurrentStep, deleteStep } from '../utils/storage'
import { undoRedoSystem, DeleteStepCommand } from '../utils/undoRedoSystem'

const ProjectSteps = ({ project, steps, onBack, onUpdateSteps, allSteps, onUpdateProject }) => {
  const [selectedStep, setSelectedStep] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [localSteps, setLocalSteps] = useState(steps)
  const [contextMenu, setContextMenu] = useState(null)

  useEffect(() => {
    setLocalSteps(steps)
  }, [steps])

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

  const handleDeleteStep = async (step) => {
    const deleteCommand = new DeleteStepCommand(
      step,
      project.id,
      deleteStep,
      createStep
    )
    
    try {
      await undoRedoSystem.executeCommand(deleteCommand)
      
      const updatedLocalSteps = localSteps.filter(s => s.id !== step.id)
      setLocalSteps(updatedLocalSteps)
      
      const otherSteps = allSteps.filter(s => s.projectId !== project.id)
      onUpdateSteps([...otherSteps, ...updatedLocalSteps])
    } catch (error) {
      console.error('Failed to delete step:', error)
      alert('Failed to delete step')
    }
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

  const handleSwipeRight = async (step) => {
    const updatedStep = { ...step, completed: true }
    await handleUpdateStep(updatedStep)
  }

  const handleSwipeLeft = async (step) => {
    const updatedStep = { ...step, completed: false }
    await handleUpdateStep(updatedStep)
  }

  const StepItem = ({ step, provided, snapshot, index }) => {
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
          } shadow-lg relative overflow-hidden select-none`}
        >
          <div {...provided.dragHandleProps} className="absolute top-2 left-2 cursor-move">
            <svg className="w-6 h-6 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
          <p className={
            step.completed 
              ? "text-green-100" 
              : project.currentStepId === step.id 
                ? "text-red-100" 
                : "text-cyan-100"
          }>{step.description}</p>
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
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        ← Back to Projects
      </button>
      
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">{project.name} - Steps</h1>
      
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
              onClick: () => handleDeleteStep(contextMenu.step),
              danger: true
            }
          ]}
        />
      )}
    </div>
  )
}

export default ProjectSteps