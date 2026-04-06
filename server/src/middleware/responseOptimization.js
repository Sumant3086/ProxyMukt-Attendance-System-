/**
 * API Response Optimization Middleware
 * FANG-Level: Compression, ETags, Caching Headers
 */

import crypto from 'crypto';
import zlib from 'zlib';

/**
 * Generate ETag for response data
 */
export function generateETag(data) {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * ETag middleware for conditional requests
 */
export function etagMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    // Skip if headers already sent
    if (res.headersSent) {
      return originalJson(data);
    }

    try {
      // Generate ETag
      const etag = generateETag(data);
      res.setHeader('ETag', `"${etag}"`);

      // Check if client has cached version
      const clientETag = req.headers['if-none-match'];
      if (clientETag === `"${etag}"`) {
        return res.status(304).end();
      }

      // Send response
      return originalJson(data);
    } catch (error) {
      console.error('ETag middleware error:', error);
      return originalJson(data);
    }
  };

  next();
}

/**
 * Response compression middleware
 */
export function compressionMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    // Skip if headers already sent
    if (res.headersSent) {
      return originalJson(data);
    }

    try {
      const acceptEncoding = req.headers['accept-encoding'] || '';
      const jsonString = JSON.stringify(data);

      // Only compress if response is large enough (> 1KB)
      if (jsonString.length < 1024) {
        return originalJson(data);
      }

      // Gzip compression
      if (acceptEncoding.includes('gzip')) {
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', 'application/json');
        
        zlib.gzip(jsonString, (err, compressed) => {
          if (err) {
            return originalJson(data);
          }
          res.send(compressed);
        });
        return;
      }

      // Deflate compression
      if (acceptEncoding.includes('deflate')) {
        res.setHeader('Content-Encoding', 'deflate');
        res.setHeader('Content-Type', 'application/json');
        
        zlib.deflate(jsonString, (err, compressed) => {
          if (err) {
            return originalJson(data);
          }
          res.send(compressed);
        });
        return;
      }

      // No compression supported
      return originalJson(data);
    } catch (error) {
      console.error('Compression middleware error:', error);
      return originalJson(data);
    }
  };

  next();
}

/**
 * Cache control headers
 */
export function cacheControl(maxAge = 0, options = {}) {
  return (req, res, next) => {
    const {
      public: isPublic = false,
      private: isPrivate = true,
      noCache = false,
      noStore = false,
      mustRevalidate = false,
      immutable = false
    } = options;

    const directives = [];

    if (noStore) {
      directives.push('no-store');
    } else if (noCache) {
      directives.push('no-cache');
    } else {
      if (isPublic) directives.push('public');
      if (isPrivate) directives.push('private');
      directives.push(`max-age=${maxAge}`);
      if (mustRevalidate) directives.push('must-revalidate');
      if (immutable) directives.push('immutable');
    }

    res.setHeader('Cache-Control', directives.join(', '));
    next();
  };
}

/**
 * Response time tracking
 */
export function responseTimeMiddleware(req, res, next) {
  const startTime = Date.now();

  // Use 'finish' event instead of setting header after response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Only set header if not already sent
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    originalEnd.apply(res, args);
  };

  next();
}

/**
 * Pagination helper with cursor-based pagination
 */
export function paginateResults(query, options = {}) {
  const {
    limit = 20,
    cursor = null,
    sortField = 'createdAt',
    sortOrder = -1
  } = options;

  // Build query with cursor
  if (cursor) {
    const cursorDoc = Buffer.from(cursor, 'base64').toString('utf-8');
    const cursorData = JSON.parse(cursorDoc);
    
    if (sortOrder === -1) {
      query[sortField] = { $lt: cursorData[sortField] };
    } else {
      query[sortField] = { $gt: cursorData[sortField] };
    }
  }

  return {
    query,
    limit: limit + 1, // Fetch one extra to check if there's more
    sort: { [sortField]: sortOrder }
  };
}

/**
 * Format paginated response
 */
export function formatPaginatedResponse(results, limit, sortField) {
  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;

  let nextCursor = null;
  if (hasMore) {
    const lastItem = items[items.length - 1];
    const cursorData = { [sortField]: lastItem[sortField] };
    nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  return {
    items,
    pagination: {
      hasMore,
      nextCursor,
      count: items.length
    }
  };
}

/**
 * Response projection (select only needed fields)
 */
export function projectFields(data, fields) {
  if (!fields || fields.length === 0) return data;

  if (Array.isArray(data)) {
    return data.map(item => projectSingleItem(item, fields));
  }

  return projectSingleItem(data, fields);
}

function projectSingleItem(item, fields) {
  const projected = {};
  fields.forEach(field => {
    if (item[field] !== undefined) {
      projected[field] = item[field];
    }
  });
  return projected;
}

/**
 * Batch response optimization
 */
export function batchResponses(responses) {
  return {
    batch: true,
    count: responses.length,
    responses,
    timestamp: Date.now()
  };
}

/**
 * Error response formatter
 */
export function formatErrorResponse(error, includeStack = false) {
  const response = {
    success: false,
    error: {
      message: error.message,
      code: error.code || 'INTERNAL_ERROR',
      timestamp: Date.now()
    }
  };

  if (includeStack && process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  return response;
}

/**
 * Success response formatter
 */
export function formatSuccessResponse(data, meta = {}) {
  return {
    success: true,
    data,
    meta: {
      timestamp: Date.now(),
      ...meta
    }
  };
}

/**
 * Middleware to add response helpers
 */
export function responseHelpersMiddleware(req, res, next) {
  // Add success helper
  res.success = (data, meta) => {
    return res.json(formatSuccessResponse(data, meta));
  };

  // Add error helper
  res.error = (message, code = 'ERROR', statusCode = 500) => {
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        code,
        timestamp: Date.now()
      }
    });
  };

  // Add paginated response helper
  res.paginated = (items, limit, sortField) => {
    const formatted = formatPaginatedResponse(items, limit, sortField);
    return res.json(formatSuccessResponse(formatted));
  };

  next();
}

export default {
  etagMiddleware,
  compressionMiddleware,
  cacheControl,
  responseTimeMiddleware,
  paginateResults,
  formatPaginatedResponse,
  projectFields,
  batchResponses,
  formatErrorResponse,
  formatSuccessResponse,
  responseHelpersMiddleware
};
