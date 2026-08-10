/**
 * Formats a file size in bytes to a human-readable string.
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Strips markdown markup to create a flat text string.
 */
export const stripMarkdown = (text: string): string => {
  return text
    .replace(/[*_#`~>]/g, '')
    .replace(/\[Source:.*?\]/g, '')
    .trim();
};

/**
 * Truncate an excerpt safely.
 */
export const truncateText = (text: string, maxLen: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
};
