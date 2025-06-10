// utils/imageUtils.js

/**
 * Get the complete image URL, handling both local and cloud-hosted images
 * @param {string} imagePath - The image path/filename or complete URL
 * @param {string} type - The image type folder ('users', 'tours', etc.)
 * @returns {string} Complete image URL
 */
export const getImageUrl = (imagePath, type = 'users') => {
  // Return default image if no path provided
  if (!imagePath || imagePath === 'undefined' || imagePath === 'null') {
    return `/img/${type}/default.jpg`;
  }

  // Handle string conversion and trim
  const path = String(imagePath).trim();
  
  // Return default if empty after trimming
  if (!path) {
    return `/img/${type}/default.jpg`;
  }
  
  // If it's already a complete URL (Cloudinary), return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // For local files, prepend the local path
  return `/img/${type}/${path}`;
};

/**
 * Get user image URL
 * @param {string} imagePath - User's profile image path
 * @returns {string} Complete image URL
 */
export const getUserImageUrl = (imagePath) => {
  return getImageUrl(imagePath, 'users');
};

/**
 * Get tour image URL
 * @param {string} imagePath - Tour image path
 * @returns {string} Complete image URL
 */
export const getTourImageUrl = (imagePath) => {
  return getImageUrl(imagePath, 'tours');
};