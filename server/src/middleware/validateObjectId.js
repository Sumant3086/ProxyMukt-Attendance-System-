/**
 * Middleware to validate MongoDB ObjectID
 * Prevents NoSQL injection attacks
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    // MongoDB ObjectID is 24 hex characters
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (!id || !objectIdPattern.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }
    
    next();
  };
};

/**
 * Validate multiple ObjectIDs in request body
 */
export const validateObjectIds = (fields = []) => {
  return (req, res, next) => {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    for (const field of fields) {
      const value = req.body[field];
      
      if (value) {
        // Handle array of IDs
        if (Array.isArray(value)) {
          const invalidIds = value.filter(id => !objectIdPattern.test(id));
          if (invalidIds.length > 0) {
            return res.status(400).json({
              success: false,
              message: `Invalid ${field} format: contains invalid ObjectIDs`,
            });
          }
        }
        // Handle single ID
        else if (!objectIdPattern.test(value)) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field} format`,
          });
        }
      }
    }
    
    next();
  };
};
