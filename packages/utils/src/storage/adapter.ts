/**
 * Storage adapter interface for file uploads
 * Supports multiple backends: local, Cloudinary, Firebase Storage, S3
 */

export interface StorageAdapter {
  /**
   * Upload a file and return its public URL
   */
  upload(file: Buffer, key: string, contentType: string): Promise<{ url: string }>;
  
  /**
   * Remove a file (optional)
   */
  remove?(key: string): Promise<void>;
  
  /**
   * Get a signed URL for temporary access (optional)
   */
  getSignedUrl?(key: string, expiresIn?: number): Promise<string>;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  provider: 'local' | 'cloudinary' | 'firebase' | 's3';
  
  // Local storage
  localPath?: string;
  localBaseUrl?: string;
  
  // Cloudinary
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  cloudinaryFolder?: string;
  
  // Firebase Storage
  firebaseStorageBucket?: string;
  firebaseCredentials?: string; // JSON string
  
  // S3
  s3Bucket?: string;
  s3Region?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3Endpoint?: string; // For S3-compatible services
}

/**
 * Validation constants
 */
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Validate file upload
 */
export function validateUpload(
  contentType: string,
  size: number
): { valid: boolean; error?: string } {
  const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);
  
  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: `Unsupported file type: ${contentType}. Allowed: ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(', ')}`
    };
  }
  
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(size / 1024 / 1024).toFixed(2)}MB. Max: ${(maxSize / 1024 / 1024).toFixed(2)}MB`
    };
  }
  
  return { valid: true };
}

/**
 * Generate a unique file key
 */
export function generateFileKey(filename: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = filename.split('.').pop() || '';
  const baseName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  
  const key = prefix 
    ? `${prefix}/${timestamp}-${random}-${baseName}.${ext}`
    : `${timestamp}-${random}-${baseName}.${ext}`;
  
  return key;
}

/**
 * Get storage adapter based on environment configuration
 */
export function getStorageAdapter(config: StorageConfig): StorageAdapter {
  switch (config.provider) {
    case 'local':
      return createLocalAdapter(config);
    case 'cloudinary':
      return createCloudinaryAdapter(config);
    case 'firebase':
      return createFirebaseAdapter(config);
    case 's3':
      return createS3Adapter(config);
    default:
      throw new Error(`Unsupported storage provider: ${config.provider}`);
  }
}

/**
 * Create local file system adapter (for development)
 */
function createLocalAdapter(config: StorageConfig): StorageAdapter {
  const fs = require('fs');
  const path = require('path');
  
  const uploadDir = config.localPath || './uploads';
  const baseUrl = config.localBaseUrl || 'http://localhost:3000/uploads';
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  return {
    async upload(file: Buffer, key: string, contentType: string): Promise<{ url: string }> {
      const filePath = path.join(uploadDir, key);
      const dir = path.dirname(filePath);
      
      // Create subdirectories if needed
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await fs.promises.writeFile(filePath, file);
      
      const url = `${baseUrl}/${key}`;
      return { url };
    },
    
    async remove(key: string): Promise<void> {
      const filePath = path.join(uploadDir, key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    }
  };
}

/**
 * Create Cloudinary adapter
 */
function createCloudinaryAdapter(config: StorageConfig): StorageAdapter {
  if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    throw new Error('Cloudinary configuration incomplete');
  }
  
  // Lazy load cloudinary
  const cloudinary = require('cloudinary').v2;
  
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret
  });
  
  return {
    async upload(file: Buffer, key: string, contentType: string): Promise<{ url: string }> {
      const isVideo = contentType.startsWith('video/');
      const resourceType = isVideo ? 'video' : 'image';
      
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: config.cloudinaryFolder || 'quinielas',
            public_id: key.replace(/\.[^/.]+$/, ''),
            resource_type: resourceType
          },
          (error: any, result: any) => {
            if (error) {
              reject(error);
            } else {
              resolve({ url: result.secure_url });
            }
          }
        );
        
        uploadStream.end(file);
      });
    },
    
    async remove(key: string): Promise<void> {
      const publicId = `${config.cloudinaryFolder || 'quinielas'}/${key.replace(/\.[^/.]+$/, '')}`;
      await cloudinary.uploader.destroy(publicId);
    }
  };
}

/**
 * Create Firebase Storage adapter
 */
function createFirebaseAdapter(config: StorageConfig): StorageAdapter {
  if (!config.firebaseStorageBucket) {
    throw new Error('Firebase Storage bucket not configured');
  }
  
  // Lazy load firebase-admin
  const admin = require('firebase-admin');
  
  // Initialize if not already initialized
  if (!admin.apps.length) {
    const credentials = config.firebaseCredentials 
      ? JSON.parse(config.firebaseCredentials)
      : undefined;
    
    admin.initializeApp({
      credential: credentials ? admin.credential.cert(credentials) : admin.credential.applicationDefault(),
      storageBucket: config.firebaseStorageBucket
    });
  }
  
  const bucket = admin.storage().bucket();
  
  return {
    async upload(file: Buffer, key: string, contentType: string): Promise<{ url: string }> {
      const fileRef = bucket.file(key);
      
      await fileRef.save(file, {
        contentType,
        metadata: {
          cacheControl: 'public, max-age=31536000'
        }
      });
      
      // Make file public
      await fileRef.makePublic();
      
      const url = `https://storage.googleapis.com/${config.firebaseStorageBucket}/${key}`;
      return { url };
    },
    
    async remove(key: string): Promise<void> {
      const fileRef = bucket.file(key);
      await fileRef.delete();
    },
    
    async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
      const fileRef = bucket.file(key);
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000
      });
      return url;
    }
  };
}

/**
 * Create S3 adapter
 */
function createS3Adapter(config: StorageConfig): StorageAdapter {
  if (!config.s3Bucket || !config.s3Region) {
    throw new Error('S3 configuration incomplete');
  }
  
  // Lazy load AWS SDK
  const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  
  const s3Client = new S3Client({
    region: config.s3Region,
    credentials: config.s3AccessKeyId && config.s3SecretAccessKey ? {
      accessKeyId: config.s3AccessKeyId,
      secretAccessKey: config.s3SecretAccessKey
    } : undefined,
    endpoint: config.s3Endpoint
  });
  
  return {
    async upload(file: Buffer, key: string, contentType: string): Promise<{ url: string }> {
      const command = new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000'
      });
      
      await s3Client.send(command);
      
      const url = config.s3Endpoint
        ? `${config.s3Endpoint}/${config.s3Bucket}/${key}`
        : `https://${config.s3Bucket}.s3.${config.s3Region}.amazonaws.com/${key}`;
      
      return { url };
    },
    
    async remove(key: string): Promise<void> {
      const command = new DeleteObjectCommand({
        Bucket: config.s3Bucket,
        Key: key
      });
      
      await s3Client.send(command);
    },
    
    async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const command = new GetObjectCommand({
        Bucket: config.s3Bucket,
        Key: key
      });
      
      return getSignedUrl(s3Client, command, { expiresIn });
    }
  };
}
