import React, { useState, useEffect } from 'react'
import { createProject, updateProject, deleteProject } from '../utils/storage'
import InputModal from './InputModal'
import ContextMenu from './ContextMenu'

const ProjectList = ({ projects, onProjectClick, onAddProject, onUpdateProject, onDeleteProject }) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectToRename, setProjectToRename] = useState(null)

  useEffect(() => {
    console.log('selectedProject changed:', selectedProject)
  }, [selectedProject])

  useEffect(() => {
    console.log('showRenameModal changed:', showRenameModal)
  }, [showRenameModal])

  useEffect(() => {
    console.log('projectToRename changed:', projectToRename)
  }, [projectToRename])
  const gradients = [
    'from-cyan-400 to-yellow-400',
    'from-purple-400 to-pink-400',
    'from-green-400 to-blue-400',
    'from-red-400 to-yellow-400',
    'from-indigo-400 to-purple-400',
  ]

  const handleAddProject = async (name) => {
    console.log('handleAddProject called with name:', name)
    
    const newProject = {
      id: Date.now().toString(),
      name,
      description: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      gradient: gradients[projects.length % gradients.length]
    }
    console.log('Creating project:', newProject)
    
    try {
      await createProject(newProject)
      console.log('Project created successfully in database')
      onAddProject(newProject)
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project: ' + error.message)
    }
  }

  const handleRenameProject = async (newName) => {
    if (!projectToRename) return
    
    console.log('Renaming project from', projectToRename.name, 'to', newName)
    
    const updatedProject = {
      ...projectToRename,
      name: newName,
      updated_at: new Date().toISOString()
    }
    
    try {
      await updateProject(updatedProject)
      console.log('Project updated in database, updating UI...')
      onUpdateProject(updatedProject)
      console.log('UI update callback called')
      setProjectToRename(null)
    } catch (error) {
      console.error('Failed to rename project:', error)
      alert('Failed to rename project: ' + error.message)
    }
  }

  const handleDeleteProject = async (project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This will also delete all its steps.`)) {
      try {
        await deleteProject(project.id)
        onDeleteProject(project.id)
      } catch (error) {
        console.error('Failed to delete project:', error)
        alert('Failed to delete project: ' + error.message)
      }
    }
  }

  const handleRightClick = (e, project) => {
    e.preventDefault()
    setSelectedProject(project)
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    })
  }

  const contextMenuItems = [
    {
      label: 'Rename',
      onClick: () => {
        console.log('Rename clicked, selected project:', selectedProject)
        setProjectToRename(selectedProject)
        setShowRenameModal(true)
      }
    },
    { divider: true },
    {
      label: 'Delete',
      danger: true,
      onClick: () => handleDeleteProject(selectedProject)
    }
  ]

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">All Projects</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onProjectClick(project)}
            onContextMenu={(e) => handleRightClick(e, project)}
            className={`bg-gradient-to-r ${project.gradient} p-8 rounded-3xl cursor-pointer transform transition-transform hover:scale-105 shadow-lg`}
          >
            <h2 className="text-xl font-semibold text-white">{project.name}</h2>
          </div>
        ))}
        
        <div
          onClick={() => {
            console.log('Plus icon clicked!')
            setShowCreateModal(true)
          }}
          className="bg-white border-2 border-dashed border-gray-300 p-8 rounded-3xl cursor-pointer transform transition-transform hover:scale-105 flex items-center justify-center"
        >
          <span className="text-4xl text-gray-400">+</span>
        </div>
      </div>
      
      <InputModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleAddProject}
        title="Create New Project"
        placeholder="Enter project name"
      />
      
      <InputModal
        isOpen={showRenameModal}
        onClose={() => {
          console.log('Closing rename modal')
          setShowRenameModal(false)
          setProjectToRename(null)
        }}
        onSubmit={handleRenameProject}
        title="Rename Project"
        placeholder="Enter new project name"
        submitLabel="Update"
        initialValue={projectToRename?.name || ""}
      />
      
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => {
            setContextMenu(null)
            setSelectedProject(null)
          }}
          items={contextMenuItems}
        />
      )}
    </div>
  )
}

export default ProjectList