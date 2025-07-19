import React, { useState, useEffect } from 'react'
import ProjectList from './components/ProjectList'
import ProjectSteps from './components/ProjectSteps'
import { loadProjects, saveProjects, loadSteps, saveSteps } from './utils/storage'

function App() {
  const [currentView, setCurrentView] = useState('projects')
  const [selectedProject, setSelectedProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [steps, setSteps] = useState([])

  useEffect(() => {
    const loadData = async () => {
      console.log('Loading data from database...')
      try {
        const loadedProjects = await loadProjects()
        console.log('Loaded projects:', loadedProjects)
        const loadedSteps = await loadSteps()
        console.log('Loaded steps:', loadedSteps)
        setProjects(loadedProjects)
        setSteps(loadedSteps)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [])

  const handleProjectClick = (project) => {
    setSelectedProject(project)
    setCurrentView('steps')
  }

  const handleBackToProjects = () => {
    setCurrentView('projects')
    setSelectedProject(null)
  }

  const handleAddProject = async (project) => {
    console.log('handleAddProject in App.jsx called with:', project)
    const newProjects = [...projects, project]
    setProjects(newProjects)
    console.log('Updated projects state:', newProjects)
    // Note: saveProjects is no longer needed as we already saved in createProject
  }

  const handleUpdateProject = (updatedProject) => {
    console.log('handleUpdateProject called with:', updatedProject)
    console.log('Current projects:', projects)
    const updatedProjects = projects.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    )
    console.log('Updated projects:', updatedProjects)
    setProjects(updatedProjects)
    console.log('Projects state updated')
  }

  const handleDeleteProject = (projectId) => {
    console.log('handleDeleteProject called with ID:', projectId)
    const filteredProjects = projects.filter(p => p.id !== projectId)
    setProjects(filteredProjects)
    
    // Also remove steps for this project
    const filteredSteps = steps.filter(s => s.projectId !== projectId)
    setSteps(filteredSteps)
    
    // If we're currently viewing this project, go back to projects list
    if (selectedProject && selectedProject.id === projectId) {
      setCurrentView('projects')
      setSelectedProject(null)
    }
  }

  const handleUpdateSteps = async (newSteps) => {
    setSteps(newSteps)
    await saveSteps(newSteps)
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ background: 'repeating-linear-gradient(0deg, #f9fafb, #f9fafb 20px, #f3f4f6 20px, #f3f4f6 21px)' }}>
      {currentView === 'projects' ? (
        <ProjectList 
          projects={projects} 
          onProjectClick={handleProjectClick}
          onAddProject={handleAddProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
        />
      ) : (
        <ProjectSteps 
          project={selectedProject}
          steps={steps.filter(step => step.projectId === selectedProject?.id)}
          onBack={handleBackToProjects}
          onUpdateSteps={handleUpdateSteps}
          allSteps={steps}
        />
      )}
    </div>
  )
}

export default App