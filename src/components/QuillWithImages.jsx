import React, { useRef, useEffect, useState } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { handleClipboardPaste, getImageAttachments, deleteImageAttachment } from '../utils/imageUtils'
import ImageThumbnails from './ImageThumbnails'

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
  const quillRef = useRef(null)
  const [imageAttachments, setImageAttachments] = useState([])

  // Simplified ref handling - just pass through the ref
  const actualRef = ref || quillRef

  const defaultModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
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
        return
      }
      
      try {
        const attachments = await getImageAttachments(contentId, contentTypeEnum)
        setImageAttachments(attachments)
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

  const handlePaste = async (event) => {
    // Check if the paste contains an image
    const items = event.clipboardData?.items;
    if (!items) return;

    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        hasImage = true;
        break;
      }
    }

    if (hasImage) {
      // Prevent default paste behavior IMMEDIATELY for images
      event.preventDefault();
      event.stopPropagation();
      
      try {
        const result = await handleClipboardPaste(event, contentId, contentTypeEnum)
        if (result) {
          // Only add image to attachments list - don't insert into editor
          setImageAttachments(prev => [...prev, result.attachment])
          
          // Optional: Show a brief notification that image was added
          console.log('Image added to attachments:', result.attachment.filename)
        }
      } catch (error) {
        console.error('Error handling paste:', error)
      }
    }
    // For non-image content, let the default paste behavior happen
  }

  // Add paste event listener with capture to intercept before Quill
  useEffect(() => {
    const quill = actualRef.current?.getEditor()
    if (quill && contentId && contentTypeEnum) {
      const handlePasteEvent = (event) => {
        handlePaste(event)
      }
      
      // Use capture phase to intercept paste before Quill processes it
      quill.root.addEventListener('paste', handlePasteEvent, true)
      
      return () => {
        quill.root.removeEventListener('paste', handlePasteEvent, true)
      }
    }
  }, [contentId, contentTypeEnum, actualRef])

  return (
    <div className="quill-with-images">
      <ReactQuill
        ref={actualRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className={className}
        style={style}
        {...props}
      />
      
      {imageAttachments.length > 0 && (
        <div className="mt-4" onClick={() => console.log('Container div clicked!')}>
          <ImageThumbnails 
            attachments={imageAttachments}
            onDelete={handleDeleteImage}
          />
        </div>
      )}
    </div>
  )
})

export default QuillWithImages