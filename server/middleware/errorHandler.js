const errorHandler = (err, req, res, next) => {
  console.error('Server error detected:', err);
  
  // Handle Multer size limit errors specifically
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File size limit exceeded. Max size allowed is 15MB.'
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  return res.status(statusCode).json({
    error: err.message || 'An unexpected server error occurred'
  });
};

export default errorHandler;
