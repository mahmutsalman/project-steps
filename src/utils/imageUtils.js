import { invoke } from '@tauri-apps/api/core';

export const uploadImage = async (imageData, filename, contentType, contentId, contentTypeEnum) => {
  try {
    const imageArray = Array.from(new Uint8Array(imageData));
    const result = await invoke('upload_image', {
      imageData: imageArray,
      filename,
      contentType,
      contentId,
      contentTypeEnum
    });
    return result;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const getImageAttachments = async (contentId, contentTypeEnum) => {
  try {
    console.log('imageUtils: About to call get_image_attachments with:', { contentId, contentTypeEnum });
    
    const result = await invoke('get_image_attachments', {
      contentId,
      contentTypeEnum
    });
    console.log('imageUtils: Backend returned:', result);
    return result;
  } catch (error) {
    console.error('Error getting image attachments:', error);
    // Return empty array on error instead of throwing
    return [];
  }
};

export const deleteImageAttachment = async (attachmentId, filePath) => {
  try {
    await invoke('delete_image_attachment', {
      attachmentId,
      filePath
    });
  } catch (error) {
    console.error('Error deleting image attachment:', error);
    throw error;
  }
};

export const getImageFileData = async (filePath) => {
  try {
    const result = await invoke('get_image_file_data', {
      filePath
    });
    return result;
  } catch (error) {
    console.error('Error getting image file data:', error);
    throw error;
  }
};

export const convertImageToBase64 = async (filePath) => {
  try {
    const imageData = await getImageFileData(filePath);
    const uint8Array = new Uint8Array(imageData);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

export const handleClipboardPaste = async (event, contentId, contentTypeEnum) => {
  const items = event.clipboardData?.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      const arrayBuffer = await file.arrayBuffer();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `pasted-image-${timestamp}.png`;
      
      try {
        const attachment = await uploadImage(
          arrayBuffer,
          filename,
          file.type || 'image/png',
          contentId,
          contentTypeEnum
        );
        
        const base64 = await convertImageToBase64(attachment.filePath);
        const dataUrl = `data:${attachment.contentType};base64,${base64}`;
        
        return {
          attachment,
          dataUrl,
          filename: attachment.filename
        };
      } catch (error) {
        console.error('Error processing pasted image:', error);
        throw error;
      }
    }
  }
  
  return null;
};

export const createImageThumbnail = async (attachment, maxWidth = 150, maxHeight = 150) => {
  try {
    const base64 = await convertImageToBase64(attachment.filePath);
    const dataUrl = `data:${attachment.contentType};base64,${base64}`;
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.8),
          width,
          height,
          originalDataUrl: dataUrl
        });
      };
      img.src = dataUrl;
    });
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw error;
  }
};

export const generateImageId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};