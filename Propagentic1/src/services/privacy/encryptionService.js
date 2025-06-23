/**
 * Encryption Service for PropAgentic
 * Handles data encryption at rest and in transit, key management, and field-level encryption
 */

import { auditLogger } from '../security/auditLogger';

class EncryptionService {
  constructor() {
    // Encryption configuration
    this.config = {
      algorithm: 'AES-GCM',
      keyLength: 256,
      ivLength: 16,
      tagLength: 16,
      keyDerivationIterations: 100000,
      saltLength: 32
    };
    
    // Field-level encryption rules
    this.fieldEncryptionRules = {
      // Highly sensitive PII fields
      high_sensitivity: [
        'ssn',
        'taxId', 
        'bankAccountNumber',
        'routingNumber',
        'creditCardNumber',
        'password',
        'securityQuestion',
        'securityAnswer'
      ],
      
      // Medium sensitivity PII fields
      medium_sensitivity: [
        'email',
        'phone',
        'dateOfBirth',
        'driverLicense',
        'passport',
        'emergencyContact'
      ],
      
      // Low sensitivity but still protected
      low_sensitivity: [
        'firstName',
        'lastName',
        'address',
        'city',
        'zipCode'
      ],
      
      // Financial data
      financial: [
        'paymentMethods',
        'paymentHistory',
        'rentAmount',
        'depositAmount',
        'feeDetails'
      ],
      
      // Communication data
      communication: [
        'messageContent',
        'attachments',
        'callRecordings',
        'meetingNotes'
      ],
      
      // Legal and compliance data
      legal: [
        'leaseTerms',
        'legalDocuments',
        'complianceData',
        'auditTrails'
      ]
    };
    
    // Encryption key management
    this.keyManagement = {
      masterKey: null,
      dataKeys: new Map(),
      keyRotationPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
      keyVersions: new Map(),
      keyMetadata: new Map()
    };
    
    // Environment-specific settings
    this.environment = process.env.NODE_ENV || 'development';
    this.isProduction = this.environment === 'production';
    
    // Transport encryption settings
    this.transportEncryption = {
      enabled: true,
      tlsVersion: '1.3',
      cipherSuites: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256'
      ]
    };
  }

  /**
   * Initialize encryption service
   */
  async initialize() {
    try {
      console.log('🔐 Initializing Encryption Service...');
      
      // Initialize Web Crypto API
      if (!crypto.subtle) {
        throw new Error('Web Crypto API not available');
      }
      
      // Initialize master key
      await this.initializeMasterKey();
      
      // Setup key rotation schedule
      this.scheduleKeyRotation();
      
      // Validate encryption capabilities
      await this.validateEncryption();
      
      console.log('✅ Encryption Service initialized');
      return { success: true };
      
    } catch (error) {
      console.error('Error initializing encryption service:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(data, context = {}) {
    try {
      const {
        keyId = 'default',
        algorithm = this.config.algorithm,
        associatedData = ''
      } = context;
      
      // Get or generate data key
      const dataKey = await this.getOrGenerateDataKey(keyId);
      
      // Convert data to ArrayBuffer
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      
      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength));
      
      // Encrypt data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: algorithm,
          iv: iv,
          additionalData: encoder.encode(associatedData)
        },
        dataKey.key,
        dataBuffer
      );
      
      // Create encrypted package
      const encryptedPackage = {
        algorithm,
        keyId: dataKey.id,
        keyVersion: dataKey.version,
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encryptedData)),
        timestamp: Date.now(),
        associatedData
      };
      
      // Log encryption event
      await auditLogger.logEvent('DATA_ENCRYPTED', {
        keyId: dataKey.id,
        keyVersion: dataKey.version,
        algorithm,
        dataSize: dataBuffer.byteLength,
        context
      });
      
      return encryptedPackage;
      
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedPackage, context = {}) {
    try {
      const {
        algorithm,
        keyId,
        keyVersion,
        iv,
        data,
        associatedData
      } = encryptedPackage;
      
      // Get decryption key
      const dataKey = await this.getDataKey(keyId, keyVersion);
      if (!dataKey) {
        throw new Error(`Encryption key not found: ${keyId}:${keyVersion}`);
      }
      
      // Convert arrays back to typed arrays
      const ivArray = new Uint8Array(iv);
      const dataArray = new Uint8Array(data);
      
      // Prepare associated data
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: algorithm,
          iv: ivArray,
          additionalData: encoder.encode(associatedData || '')
        },
        dataKey.key,
        dataArray
      );
      
      // Convert back to original data
      const decryptedString = decoder.decode(decryptedBuffer);
      const decryptedData = JSON.parse(decryptedString);
      
      // Log decryption event
      await auditLogger.logEvent('DATA_DECRYPTED', {
        keyId,
        keyVersion,
        algorithm,
        dataSize: decryptedBuffer.byteLength,
        context
      });
      
      return decryptedData;
      
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
  }

  /**
   * Encrypt specific fields in an object
   */
  async encryptFields(obj, fieldsToEncrypt = [], context = {}) {
    try {
      const result = { ...obj };
      const encryptedFields = [];
      
      for (const field of fieldsToEncrypt) {
        if (result[field] !== undefined && result[field] !== null) {
          // Determine sensitivity level
          const sensitivityLevel = this.getFieldSensitivityLevel(field);
          
          // Encrypt the field
          const encryptedValue = await this.encryptData(
            result[field], 
            { 
              ...context, 
              field, 
              sensitivityLevel,
              keyId: `field_${sensitivityLevel}`
            }
          );
          
          result[field] = encryptedValue;
          encryptedFields.push(field);
        }
      }
      
      // Add metadata about encrypted fields
      result._encryption = {
        encryptedFields,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      return result;
      
    } catch (error) {
      console.error('Error encrypting fields:', error);
      throw error;
    }
  }

  /**
   * Decrypt specific fields in an object
   */
  async decryptFields(obj, fieldsToDecrypt = [], context = {}) {
    try {
      const result = { ...obj };
      
      // Use encrypted fields metadata if available
      const encryptedFields = fieldsToDecrypt.length > 0 
        ? fieldsToDecrypt 
        : (obj._encryption?.encryptedFields || []);
      
      for (const field of encryptedFields) {
        if (result[field] && typeof result[field] === 'object' && result[field].algorithm) {
          // This field is encrypted
          const decryptedValue = await this.decryptData(
            result[field], 
            { ...context, field }
          );
          
          result[field] = decryptedValue;
        }
      }
      
      // Remove encryption metadata if it exists
      delete result._encryption;
      
      return result;
      
    } catch (error) {
      console.error('Error decrypting fields:', error);
      throw error;
    }
  }

  /**
   * Auto-encrypt based on field rules
   */
  async autoEncryptObject(obj, context = {}) {
    try {
      const fieldsToEncrypt = [];
      
      // Identify fields that need encryption
      Object.keys(obj).forEach(field => {
        if (this.shouldEncryptField(field)) {
          fieldsToEncrypt.push(field);
        }
      });
      
      if (fieldsToEncrypt.length === 0) {
        return obj;
      }
      
      return await this.encryptFields(obj, fieldsToEncrypt, context);
      
    } catch (error) {
      console.error('Error auto-encrypting object:', error);
      throw error;
    }
  }

  /**
   * Auto-decrypt based on field rules
   */
  async autoDecryptObject(obj, context = {}) {
    try {
      if (!obj._encryption) {
        return obj;
      }
      
      return await this.decryptFields(obj, obj._encryption.encryptedFields, context);
      
    } catch (error) {
      console.error('Error auto-decrypting object:', error);
      throw error;
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  async hashData(data, salt = null) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate salt if not provided
      if (!salt) {
        salt = crypto.getRandomValues(new Uint8Array(this.config.saltLength));
      } else if (typeof salt === 'string') {
        salt = encoder.encode(salt);
      }
      
      // Combine data and salt
      const combined = new Uint8Array(dataBuffer.length + salt.length);
      combined.set(dataBuffer);
      combined.set(salt, dataBuffer.length);
      
      // Hash with PBKDF2
      const key = await crypto.subtle.importKey(
        'raw',
        combined,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      
      const hashBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          hash: 'SHA-256',
          salt: salt,
          iterations: this.config.keyDerivationIterations
        },
        key,
        256
      );
      
      return {
        hash: Array.from(new Uint8Array(hashBits)),
        salt: Array.from(salt),
        iterations: this.config.keyDerivationIterations
      };
      
    } catch (error) {
      console.error('Error hashing data:', error);
      throw error;
    }
  }

  /**
   * Verify hashed data
   */
  async verifyHash(data, hashObj) {
    try {
      const { hash, salt, iterations } = hashObj;
      
      // Recreate the hash with the same salt
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const saltArray = new Uint8Array(salt);
      
      const combined = new Uint8Array(dataBuffer.length + saltArray.length);
      combined.set(dataBuffer);
      combined.set(saltArray, dataBuffer.length);
      
      const key = await crypto.subtle.importKey(
        'raw',
        combined,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      
      const verifyHashBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          hash: 'SHA-256',
          salt: saltArray,
          iterations: iterations || this.config.keyDerivationIterations
        },
        key,
        256
      );
      
      const verifyHash = Array.from(new Uint8Array(verifyHashBits));
      
      // Compare hashes
      return this.constantTimeCompare(hash, verifyHash);
      
    } catch (error) {
      console.error('Error verifying hash:', error);
      return false;
    }
  }

  /**
   * Generate encryption key for specific purpose
   */
  async generateDataKey(keyId, purpose = 'general') {
    try {
      // Generate new AES key
      const key = await crypto.subtle.generateKey(
        {
          name: this.config.algorithm,
          length: this.config.keyLength
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
      
      // Create key metadata
      const keyData = {
        id: keyId,
        key,
        purpose,
        version: Date.now(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.keyManagement.keyRotationPeriod),
        status: 'active'
      };
      
      // Store key
      this.keyManagement.dataKeys.set(keyId, keyData);
      this.keyManagement.keyVersions.set(`${keyId}:${keyData.version}`, keyData);
      
      // Store metadata
      this.keyManagement.keyMetadata.set(keyId, {
        currentVersion: keyData.version,
        purpose,
        createdAt: keyData.createdAt,
        rotationScheduled: keyData.expiresAt
      });
      
      await auditLogger.logEvent('ENCRYPTION_KEY_GENERATED', {
        keyId,
        purpose,
        version: keyData.version
      });
      
      return keyData;
      
    } catch (error) {
      console.error('Error generating data key:', error);
      throw error;
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateKey(keyId) {
    try {
      const oldKey = this.keyManagement.dataKeys.get(keyId);
      if (!oldKey) {
        throw new Error(`Key not found for rotation: ${keyId}`);
      }
      
      // Generate new key version
      const newKey = await this.generateDataKey(keyId, oldKey.purpose);
      
      // Mark old key as deprecated
      oldKey.status = 'deprecated';
      oldKey.deprecatedAt = new Date();
      
      await auditLogger.logEvent('ENCRYPTION_KEY_ROTATED', {
        keyId,
        oldVersion: oldKey.version,
        newVersion: newKey.version
      });
      
      return newKey;
      
    } catch (error) {
      console.error('Error rotating key:', error);
      throw error;
    }
  }

  /**
   * Key management helper methods
   */

  async initializeMasterKey() {
    // In production, this would use a proper key management service
    const masterKeyData = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // not extractable
      ['encrypt', 'decrypt']
    );
    
    this.keyManagement.masterKey = masterKeyData;
    
    // Generate default data keys
    await this.generateDataKey('default', 'general');
    await this.generateDataKey('field_high_sensitivity', 'pii_high');
    await this.generateDataKey('field_medium_sensitivity', 'pii_medium');
    await this.generateDataKey('field_low_sensitivity', 'pii_low');
    await this.generateDataKey('field_financial', 'financial');
    await this.generateDataKey('field_communication', 'communication');
    await this.generateDataKey('field_legal', 'legal');
  }

  async getOrGenerateDataKey(keyId) {
    let key = this.keyManagement.dataKeys.get(keyId);
    
    if (!key || key.status === 'expired') {
      key = await this.generateDataKey(keyId);
    }
    
    return key;
  }

  async getDataKey(keyId, version = null) {
    if (version) {
      return this.keyManagement.keyVersions.get(`${keyId}:${version}`);
    }
    
    return this.keyManagement.dataKeys.get(keyId);
  }

  scheduleKeyRotation() {
    // Schedule automatic key rotation
    setInterval(async () => {
      const now = new Date();
      
      for (const [keyId, keyData] of this.keyManagement.dataKeys) {
        if (keyData.expiresAt <= now && keyData.status === 'active') {
          try {
            await this.rotateKey(keyId);
          } catch (error) {
            console.error(`Error rotating key ${keyId}:`, error);
          }
        }
      }
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  shouldEncryptField(fieldName) {
    return Object.values(this.fieldEncryptionRules).some(fields =>
      fields.includes(fieldName)
    );
  }

  getFieldSensitivityLevel(fieldName) {
    for (const [level, fields] of Object.entries(this.fieldEncryptionRules)) {
      if (fields.includes(fieldName)) {
        return level;
      }
    }
    return 'low_sensitivity';
  }

  constantTimeCompare(a, b) {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    
    return result === 0;
  }

  async validateEncryption() {
    // Test basic encryption/decryption
    const testData = { test: 'encryption_validation' };
    const encrypted = await this.encryptData(testData);
    const decrypted = await this.decryptData(encrypted);
    
    if (JSON.stringify(testData) !== JSON.stringify(decrypted)) {
      throw new Error('Encryption validation failed');
    }
    
    console.log('✅ Encryption validation passed');
  }

  /**
   * Get encryption status report
   */
  getEncryptionStatus() {
    const keyCount = this.keyManagement.dataKeys.size;
    const activeKeys = Array.from(this.keyManagement.dataKeys.values())
      .filter(key => key.status === 'active').length;
    
    return {
      enabled: true,
      algorithm: this.config.algorithm,
      keyCount,
      activeKeys,
      environment: this.environment,
      transportEncryption: this.transportEncryption,
      fieldEncryptionRules: Object.keys(this.fieldEncryptionRules),
      lastValidation: new Date()
    };
  }
}

// Create and export singleton instance
export const encryptionService = new EncryptionService();
export default encryptionService; 