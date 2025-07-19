import React, { useState, useEffect } from 'react'
import StepModal from './StepModal'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { createStep, updateStep } from '../utils/storage'

const ProjectSteps = ({ project, steps, onBack, onUpdateSteps, allSteps }) => {
  const [selectedStep, setSelectedStep] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [localSteps, setLocalSteps] = useState(steps)

  useEffect(() => {
    setLocalSteps(steps)
  }, [steps])

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

  const handleStepClick = (step) => {
    setSelectedStep(step)
    setShowModal(true)
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

  return (
    <div className="container mx-auto p-8">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
      >
        ← Back to Projects
      </button>
      
      <h1 className="text-3xl font-bold mb-8">{project.name} - Steps</h1>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="steps">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {localSteps.sort((a, b) => a.order - b.order).map((step, index) => (
                <Draggable key={step.id} draggableId={step.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onClick={() => handleStepClick(step)}
                      className={`bg-cyan-500 text-white p-6 rounded-2xl cursor-pointer transform transition-all ${
                        snapshot.isDragging ? 'rotate-2 scale-105' : 'hover:scale-102'
                      } shadow-lg`}
                    >
                      <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                      <p className="text-cyan-100">{step.description}</p>
                    </div>
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
    </div>
  )
}

export default ProjectSteps