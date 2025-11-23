export interface UploadResponseDto {
  success: boolean;
  message: string;
  data?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    contentType: string;
    uploadedAt: string;
  };
  error?: string;
}

export interface DeleteResponseDto {
  success: boolean;
  message: string;
  error?: string;
}

export interface UploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxSizeInMB?: number;
}