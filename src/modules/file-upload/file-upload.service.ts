import { storage } from '../../db/firebase';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  getMetadata 
} from 'firebase/storage';
import { UploadOptions } from './dto/file-upload.dto';

export class UploadService {
  private readonly defaultFolder = 'uploads';
  private readonly defaultAllowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];
  private readonly defaultMaxSizeInMB = 5;

  /**
   * Upload a file to Firebase Storage
   */
  async uploadFile(
    file: Express.Multer.File,
    options?: UploadOptions
  ): Promise<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    contentType: string;
    uploadedAt: string;
  }> {
    try {
      // Validate file
      this.validateFile(file, options);

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = this.sanitizeFileName(file.originalname);
      const fileName = `${timestamp}_${sanitizedName}`;
      
      // Determine folder path
      const folder = options?.folder || this.defaultFolder;
      const filePath = `${folder}/${fileName}`;

      // Create storage reference
      const storageRef = ref(storage, filePath);

      // Upload file
      const metadata = {
        contentType: file.mimetype,
        customMetadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        }
      };

      await uploadBytes(storageRef, file.buffer, metadata);

      // Get download URL
      const fileUrl = await getDownloadURL(storageRef);

      return {
        fileName: filePath,
        fileUrl,
        fileSize: file.size,
        contentType: file.mimetype,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options?: UploadOptions
  ): Promise<Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    contentType: string;
    uploadedAt: string;
  }>> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, options));
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string) {
    try {
      const storageRef = ref(storage, filePath);
      const metadata = await getMetadata(storageRef);
      return metadata;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: Express.Multer.File, options?: UploadOptions): void {
    const allowedTypes = options?.allowedTypes || this.defaultAllowedTypes;
    const maxSizeInMB = options?.maxSizeInMB || this.defaultMaxSizeInMB;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    if (file.size > maxSizeInBytes) {
      throw new Error(
        `File size exceeds limit. Maximum size: ${maxSizeInMB}MB`
      );
    }
  }

  /**
   * Sanitize filename
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Handle errors
   */
  private handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error('An error occurred during file operation');
  }
}