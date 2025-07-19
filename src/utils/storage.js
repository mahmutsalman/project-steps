import { invoke } from '@tauri-apps/api/core'

export const loadProjects = async () => {
  try {
    console.log('Invoking get_all_projects Tauri command...')
    const projects = await invoke('get_all_projects')
    console.log('Projects received from Tauri:', projects)
    return projects
  } catch (error) {
    console.error('Error loading projects:', error)
    return []
  }
}

export const saveProjects = async (projects) => {
  console.log('Projects are now saved automatically via SQLite')
}

export const createProject = async (project) => {
  try {
    console.log('Invoking create_project Tauri command with:', project)
    await invoke('create_project', { project })
    console.log('Project created successfully via Tauri')
  } catch (error) {
    console.error('Error creating project:', error)
    throw error
  }
}

export const updateProject = async (project) => {
  try {
    console.log('Invoking update_project Tauri command with:', project)
    await invoke('update_project', { project })
    console.log('Project updated successfully via Tauri')
  } catch (error) {
    console.error('Error updating project:', error)
    throw error
  }
}

export const deleteProject = async (projectId) => {
  try {
    console.log('Invoking delete_project Tauri command with ID:', projectId)
    await invoke('delete_project', { project_id: projectId })
    console.log('Project deleted successfully via Tauri')
  } catch (error) {
    console.error('Error deleting project:', error)
    throw error
  }
}

export const loadSteps = async () => {
  try {
    const steps = await invoke('get_all_steps')
    return steps.map(step => ({
      ...step,
      order: step.order_index,
      projectId: step.project_id,
      createdAt: step.created_at,
      updatedAt: step.updated_at
    }))
  } catch (error) {
    console.error('Error loading steps:', error)
    return []
  }
}

export const saveSteps = async (steps) => {
  try {
    const formattedSteps = steps.map(step => ({
      id: step.id,
      project_id: step.projectId,
      title: step.title,
      description: step.description,
      order_index: step.order,
      completed: step.completed || false,
      created_at: step.createdAt,
      updated_at: step.updatedAt
    }))
    
    await invoke('update_steps_batch', { steps: formattedSteps })
  } catch (error) {
    console.error('Error saving steps:', error)
    throw error
  }
}

export const createStep = async (step) => {
  try {
    const formattedStep = {
      id: step.id,
      project_id: step.projectId,
      title: step.title,
      description: step.description,
      order_index: step.order,
      completed: step.completed || false,
      created_at: step.createdAt,
      updated_at: step.updatedAt
    }
    
    await invoke('create_step', { step: formattedStep })
  } catch (error) {
    console.error('Error creating step:', error)
    throw error
  }
}

export const updateStep = async (step) => {
  try {
    const formattedStep = {
      id: step.id,
      project_id: step.projectId,
      title: step.title,
      description: step.description,
      order_index: step.order,
      completed: step.completed || false,
      created_at: step.createdAt,
      updated_at: step.updatedAt
    }
    
    await invoke('update_step', { step: formattedStep })
  } catch (error) {
    console.error('Error updating step:', error)
    throw error
  }
}