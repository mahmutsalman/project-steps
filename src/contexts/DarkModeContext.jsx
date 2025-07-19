import React, { createContext, useContext, useState, useEffect } from 'react'

const DarkModeContext = createContext()

export const useDarkMode = () => {
  const context = useContext(DarkModeContext)
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  }
  return context
}

export const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Load dark mode preference from localStorage
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode !== null) {
      setIsDarkMode(JSON.parse(savedMode))
    } else {
      // Default to system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(systemPrefersDark)
    }
  }, [])

  useEffect(() => {
    // Save to localStorage whenever dark mode changes
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
    
    // Apply dark class to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev)
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}