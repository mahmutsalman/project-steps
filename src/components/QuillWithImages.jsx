import React, { useRef, useEffect, useState, useCallback } from 'react'
import ReactQuill, { Quill } from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { handleClipboardPaste, getImageAttachments, deleteImageAttachment } from '../utils/imageUtils'
import ImageThumbnails from './ImageThumbnails'

const Delta = Quill.import('delta')

const QuillWithImages = React.forwardRef(({ 
  value, 
  onChange, 
  contentId, 
  contentTypeEnum, 
  placeholder, 
  className,
  style,
  modules: customModules,
  ...props 
}, ref) => {
  const internalQuillRef = useRef(null)
  const [imageAttachments, setImageAttachments] = useState([])
  const containerRef = useRef(null)
  const [isCompact, setIsCompact] = useState(false)

  // Use internal ref for ReactQuill component
  const quillRef = useRef(null)

  const defaultModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      [{ 'size': ['small', 'normal', false, 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
  }

  const modules = customModules || defaultModules

  useEffect(() => {
    const loadImageAttachments = async () => {
      if (!contentId || !contentTypeEnum) {
        setImageAttachments([])
        return
      }
      
      try {
        const attachments = await getImageAttachments(contentId, contentTypeEnum)
        setImageAttachments(attachments || [])
      } catch (error) {
        console.error('Error loading image attachments:', error)
        setImageAttachments([]) // Set empty array on error
      }
    }

    loadImageAttachments()
  }, [contentId, contentTypeEnum])

  const handleDeleteImage = async (attachment) => {
    try {
      await deleteImageAttachment(attachment.id, attachment.filePath)
      setImageAttachments(prev => prev.filter(img => img.id !== attachment.id))
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  const handlePaste = useCallback(async (event) => {
    console.log('Paste event detected in QuillWithImages')
    
    // Check if the paste contains an image
    const items = event.clipboardData?.items;
    if (!items) {
      console.log('No clipboard items found')
      return;
    }

    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      console.log('Clipboard item type:', items[i].type)
      if (items[i].type.indexOf('image') !== -1) {
        hasImage = true;
        break;
      }
    }

    if (hasImage) {
      console.log('Image detected in clipboard, preventing default paste')
      // Prevent default paste behavior IMMEDIATELY for images
      event.preventDefault();
      event.stopPropagation();
      
      try {
        const result = await handleClipboardPaste(event, contentId, contentTypeEnum)
        if (result) {
          // Only add image to attachments list - don't insert into editor
          setImageAttachments(prev => {
            const newAttachments = [...prev, result.attachment]
            console.log('Updated imageAttachments:', newAttachments)
            return newAttachments
          })
          
          // Optional: Show a brief notification that image was added
          console.log('Image added to attachments:', result.attachment.filename)
        }
      } catch (error) {
        console.error('Error handling paste:', error)
      }
    } else {
      console.log('No image in clipboard, allowing default paste')
    }
    // For non-image content, let the default paste behavior happen
  }, [contentId, contentTypeEnum])

  // Add document-level paste listener to intercept before Quill
  useEffect(() => {
    if (!contentId || !contentTypeEnum) {
      console.log('Skipping document paste listener - no contentId or contentTypeEnum')
      return
    }

    const handleDocumentPaste = async (e) => {
      // Check if the paste event is targeting our Quill editor
      const quill = quillRef.current?.getEditor()
      if (!quill || !quill.hasFocus()) {
        return // Not our editor, ignore
      }
      
      console.log('Document paste event detected in focused Quill editor')
      
      // Check if the paste contains an image
      const items = e.clipboardData?.items
      if (!items) {
        console.log('No clipboard items found')
        return
      }

      let hasImage = false
      for (let i = 0; i < items.length; i++) {
        console.log('Clipboard item type:', items[i].type)
        if (items[i].type.indexOf('image') !== -1) {
          hasImage = true
          break
        }
      }

      if (hasImage) {
        console.log('Image detected in clipboard, preventing default paste')
        e.preventDefault()
        e.stopPropagation()
        
        // Handle the image paste
        await handlePaste(e)
      }
    }

    // Add paste listener to document with capture to intercept before Quill
    document.addEventListener('paste', handleDocumentPaste, true)
    console.log('Added document-level paste listener')
    
    return () => {
      document.removeEventListener('paste', handleDocumentPaste, true)
      console.log('Removed document-level paste listener')
    }
  }, [contentId, contentTypeEnum, handlePaste])

  // Monitor container height to determine compact mode
  useEffect(() => {
    const checkCompactMode = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.offsetHeight
        const windowHeight = window.innerHeight
        
        // If container takes up more than 70% of window height, use compact mode
        const shouldBeCompact = (containerHeight / windowHeight) > 0.7 || windowHeight < 600
        setIsCompact(shouldBeCompact)
      }
    }

    // Check initially
    checkCompactMode()

    // Check on window resize
    window.addEventListener('resize', checkCompactMode)
    
    // Use ResizeObserver if available to monitor container size changes
    let resizeObserver
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(checkCompactMode)
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', checkCompactMode)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [])

  // Expose image attachments and delete handler for external use
  React.useImperativeHandle(ref, () => ({
    getEditor: () => quillRef.current?.getEditor(),
    getImageAttachments: () => imageAttachments,
    handleDeleteImage: handleDeleteImage
  }), [imageAttachments])

  return (
    <div ref={containerRef} className="quill-with-images-container">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className={className}
        style={style}
        {...props}
      />
      
      {/* Render image thumbnails outside but as part of this component */}
      {imageAttachments.length > 0 && (
        <div className={`${isCompact ? 'mt-2' : 'mt-4'}`}>
          <label className={`block font-medium text-gray-700 dark:text-gray-300 mb-2 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            Attached Images ({imageAttachments.length})
          </label>
          <ImageThumbnails 
            attachments={imageAttachments}
            onDelete={handleDeleteImage}
            compact={isCompact}
          />
        </div>
      )}
    </div>
  )
})

export default QuillWithImages