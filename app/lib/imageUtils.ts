/**
 * Image utility functions for resizing and processing images
 */

/**
 * Resizes an image to the specified dimensions and returns it as a data URL
 * @param file - The image file to resize
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @param quality - JPEG quality (0-1)
 * @returns Promise<string> - Data URL of the resized image
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 100,
  maxHeight: number = 100,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and resize the image
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to data URL with specified quality
      const dataURL = canvas.toDataURL('image/jpeg', quality);
      resolve(dataURL);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a data URL to base64 string for vCard PHOTO property
 * @param dataURL - The data URL to convert
 * @returns string - Base64 encoded string without data URL prefix
 */
export function dataURLToBase64(dataURL: string): string {
  // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
  const base64Index = dataURL.indexOf(',');
  if (base64Index === -1) {
    throw new Error('Invalid data URL format');
  }
  return dataURL.substring(base64Index + 1);
}

/**
 * Gets the MIME type from a data URL
 * @param dataURL - The data URL to extract MIME type from
 * @returns string - MIME type (e.g., "image/jpeg")
 */
export function getMimeTypeFromDataURL(dataURL: string): string {
  const mimeMatch = dataURL.match(/data:([^;]+);/);
  return mimeMatch ? mimeMatch[1] : 'image/jpeg';
}
