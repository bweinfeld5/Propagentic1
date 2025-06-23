/**
 * Input Sanitization Service for PropAgentic
 * Prevents XSS attacks, SQL injection, and other input-based vulnerabilities
 */

class InputSanitizer {
  constructor() {
    // Common XSS patterns to detect and sanitize
    this.xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /onmouseover\s*=/gi,
      /onfocus\s*=/gi,
      /onblur\s*=/gi,
      /onchange\s*=/gi,
      /onsubmit\s*=/gi
    ];
    
    // SQL injection patterns (even though we use Firestore, good to be safe)
    this.sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /'(\s*(or|and)\s*'.*'|;|--|\/\*|\*\/)/gi,
      /(\b(sleep|benchmark|waitfor)\s*\()/gi
    ];
    
    // HTML entities map for encoding
    this.htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    
    // Allowed HTML tags for rich text content
    this.allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    this.allowedAttributes = ['class', 'id'];
    
    // File type whitelist
    this.allowedFileTypes = {
      images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      documents: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
      spreadsheets: ['xls', 'xlsx', 'csv'],
      archives: ['zip', 'rar']
    };
    
    // Maximum lengths for different input types
    this.maxLengths = {
      email: 254,
      password: 128,
      name: 50,
      phone: 20,
      address: 200,
      description: 1000,
      title: 100,
      message: 2000,
      notes: 500,
      url: 2000
    };
  }

  /**
   * Sanitize a string by removing/encoding dangerous characters
   */
  sanitizeString(input, options = {}) {
    if (typeof input !== 'string') {
      return '';
    }
    
    let sanitized = input;
    
    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Handle different sanitization levels
    const level = options.level || 'strict';
    
    switch (level) {
      case 'strict':
        // Remove all HTML tags and encode entities
        sanitized = this.stripHtml(sanitized);
        sanitized = this.encodeHtmlEntities(sanitized);
        break;
        
      case 'moderate':
        // Allow some safe HTML tags but encode dangerous ones
        sanitized = this.sanitizeHtml(sanitized);
        break;
        
      case 'basic':
        // Just encode dangerous characters
        sanitized = this.encodeHtmlEntities(sanitized);
        break;
    }
    
    // Remove XSS patterns
    sanitized = this.removeXssPatterns(sanitized);
    
    // Remove SQL injection patterns
    sanitized = this.removeSqlPatterns(sanitized);
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Apply length limits if specified
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    return sanitized;
  }

  /**
   * Strip all HTML tags from a string
   */
  stripHtml(input) {
    return input.replace(/<[^>]*>/g, '');
  }

  /**
   * Encode HTML entities
   */
  encodeHtmlEntities(input) {
    return input.replace(/[&<>"'`=/]/g, (match) => {
      return this.htmlEntities[match] || match;
    });
  }

  /**
   * Sanitize HTML by removing dangerous tags and attributes
   */
  sanitizeHtml(input) {
    // Remove script, style, and other dangerous tags completely
    let sanitized = input.replace(/<(script|style|iframe|object|embed|link|meta|form|input|button)[^>]*>.*?<\/\1>/gi, '');
    
    // Remove dangerous attributes from all tags
    sanitized = sanitized.replace(/<([^>]+)>/g, (match, tagContent) => {
      // Extract tag name
      const tagName = tagContent.split(' ')[0].toLowerCase();
      
      // Check if tag is allowed
      if (!this.allowedTags.includes(tagName)) {
        return '';
      }
      
      // Remove dangerous attributes
      let cleanTagContent = tagContent.replace(/\s+(on\w+|style|src|href)\s*=\s*["'][^"']*["']/gi, '');
      
      return `<${cleanTagContent}>`;
    });
    
    return sanitized;
  }

  /**
   * Remove XSS patterns
   */
  removeXssPatterns(input) {
    let cleaned = input;
    
    this.xssPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned;
  }

  /**
   * Remove SQL injection patterns
   */
  removeSqlPatterns(input) {
    let cleaned = input;
    
    this.sqlPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned;
  }

  /**
   * Sanitize email addresses
   */
  sanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
      return '';
    }
    
    // Remove dangerous characters and normalize
    let sanitized = email.toLowerCase().trim();
    sanitized = sanitized.replace(/[^\w.@+-]/g, '');
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      return '';
    }
    
    // Check length
    if (sanitized.length > this.maxLengths.email) {
      return '';
    }
    
    return sanitized;
  }

  /**
   * Sanitize phone numbers
   */
  sanitizePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return '';
    }
    
    // Remove all non-digit characters except + for international numbers
    let sanitized = phone.replace(/[^\d+\-\(\)\s]/g, '');
    
    // Limit length
    if (sanitized.length > this.maxLengths.phone) {
      sanitized = sanitized.substring(0, this.maxLengths.phone);
    }
    
    return sanitized.trim();
  }

  /**
   * Sanitize URLs
   */
  sanitizeUrl(url) {
    if (!url || typeof url !== 'string') {
      return '';
    }
    
    let sanitized = url.trim();
    
    // Remove dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
    const lowerUrl = sanitized.toLowerCase();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return '';
      }
    }
    
    // Ensure safe protocols
    if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
      sanitized = 'https://' + sanitized;
    }
    
    // Check length
    if (sanitized.length > this.maxLengths.url) {
      return '';
    }
    
    return sanitized;
  }

  /**
   * Sanitize file names
   */
  sanitizeFileName(fileName) {
    if (!fileName || typeof fileName !== 'string') {
      return '';
    }
    
    // Remove path traversal attempts and dangerous characters
    let sanitized = fileName.replace(/[\/\\:*?"<>|]/g, '');
    sanitized = sanitized.replace(/\.\./g, '');
    sanitized = sanitized.replace(/^\./g, '');
    
    // Limit length
    if (sanitized.length > 255) {
      // Preserve file extension
      const lastDot = sanitized.lastIndexOf('.');
      if (lastDot > 0) {
        const name = sanitized.substring(0, lastDot);
        const ext = sanitized.substring(lastDot);
        sanitized = name.substring(0, 255 - ext.length) + ext;
      } else {
        sanitized = sanitized.substring(0, 255);
      }
    }
    
    return sanitized;
  }

  /**
   * Validate file type
   */
  validateFileType(fileName, allowedCategories = ['images', 'documents']) {
    if (!fileName || typeof fileName !== 'string') {
      return { valid: false, reason: 'Invalid file name' };
    }
    
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (!extension) {
      return { valid: false, reason: 'No file extension found' };
    }
    
    const allowedExtensions = [];
    allowedCategories.forEach(category => {
      if (this.allowedFileTypes[category]) {
        allowedExtensions.push(...this.allowedFileTypes[category]);
      }
    });
    
    if (!allowedExtensions.includes(extension)) {
      return { 
        valid: false, 
        reason: `File type .${extension} not allowed. Allowed types: ${allowedExtensions.join(', ')}` 
      };
    }
    
    return { valid: true };
  }

  /**
   * Sanitize form data object
   */
  sanitizeFormData(formData, fieldConfig = {}) {
    const sanitized = {};
    const errors = {};
    
    for (const [key, value] of Object.entries(formData)) {
      const config = fieldConfig[key] || {};
      const fieldType = config.type || 'string';
      
      try {
        switch (fieldType) {
          case 'email':
            sanitized[key] = this.sanitizeEmail(value);
            if (config.required && !sanitized[key]) {
              errors[key] = 'Valid email address is required';
            }
            break;
            
          case 'phone':
            sanitized[key] = this.sanitizePhoneNumber(value);
            if (config.required && !sanitized[key]) {
              errors[key] = 'Valid phone number is required';
            }
            break;
            
          case 'url':
            sanitized[key] = this.sanitizeUrl(value);
            if (config.required && !sanitized[key]) {
              errors[key] = 'Valid URL is required';
            }
            break;
            
          case 'number':
            const num = parseFloat(value);
            sanitized[key] = isNaN(num) ? null : num;
            if (config.required && sanitized[key] === null) {
              errors[key] = 'Valid number is required';
            }
            break;
            
          case 'richtext':
            sanitized[key] = this.sanitizeString(value, { level: 'moderate' });
            break;
            
          default:
            sanitized[key] = this.sanitizeString(value, {
              level: config.level || 'strict',
              maxLength: config.maxLength || this.maxLengths[key]
            });
            if (config.required && !sanitized[key]) {
              errors[key] = `${key} is required`;
            }
            break;
        }
        
        // Additional validation
        if (config.minLength && sanitized[key] && sanitized[key].length < config.minLength) {
          errors[key] = `${key} must be at least ${config.minLength} characters`;
        }
        
        if (config.pattern && sanitized[key] && !config.pattern.test(sanitized[key])) {
          errors[key] = config.patternMessage || `${key} format is invalid`;
        }
        
      } catch (error) {
        console.error(`Error sanitizing field ${key}:`, error);
        errors[key] = `Invalid ${key} format`;
        sanitized[key] = '';
      }
    }
    
    return {
      data: sanitized,
      errors: Object.keys(errors).length > 0 ? errors : null,
      isValid: Object.keys(errors).length === 0
    };
  }

  /**
   * Security scan for potential threats
   */
  securityScan(input) {
    const threats = [];
    
    if (typeof input !== 'string') {
      return { threats, risk: 'low' };
    }
    
    // Check for XSS patterns
    this.xssPatterns.forEach((pattern, index) => {
      if (pattern.test(input)) {
        threats.push({
          type: 'xss',
          pattern: pattern.source,
          severity: 'high'
        });
      }
    });
    
    // Check for SQL injection patterns
    this.sqlPatterns.forEach((pattern, index) => {
      if (pattern.test(input)) {
        threats.push({
          type: 'sql_injection',
          pattern: pattern.source,
          severity: 'medium'
        });
      }
    });
    
    // Check for suspicious characters
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input)) {
      threats.push({
        type: 'control_characters',
        severity: 'medium'
      });
    }
    
    // Determine overall risk level
    let risk = 'low';
    if (threats.some(t => t.severity === 'high')) {
      risk = 'high';
    } else if (threats.some(t => t.severity === 'medium')) {
      risk = 'medium';
    }
    
    return { threats, risk };
  }

  /**
   * Create sanitization configuration for common form types
   */
  getFormConfig(formType) {
    const configs = {
      login: {
        email: { type: 'email', required: true },
        password: { type: 'string', required: true, maxLength: 128 }
      },
      
      signup: {
        email: { type: 'email', required: true },
        password: { type: 'string', required: true, minLength: 6, maxLength: 128 },
        firstName: { type: 'string', required: true, maxLength: 50 },
        lastName: { type: 'string', required: true, maxLength: 50 },
        phone: { type: 'phone', required: false }
      },
      
      property: {
        name: { type: 'string', required: true, maxLength: 100 },
        address: { type: 'string', required: true, maxLength: 200 },
        description: { type: 'richtext', required: false, maxLength: 1000 },
        rent: { type: 'number', required: true },
        units: { type: 'number', required: true }
      },
      
      message: {
        subject: { type: 'string', required: true, maxLength: 100 },
        content: { type: 'richtext', required: true, maxLength: 2000 },
        attachmentUrl: { type: 'url', required: false }
      },
      
      profile: {
        firstName: { type: 'string', required: true, maxLength: 50 },
        lastName: { type: 'string', required: true, maxLength: 50 },
        phone: { type: 'phone', required: false },
        bio: { type: 'richtext', required: false, maxLength: 500 },
        website: { type: 'url', required: false }
      }
    };
    
    return configs[formType] || {};
  }
}

// Create and export singleton instance
export const inputSanitizer = new InputSanitizer();
export default inputSanitizer; 