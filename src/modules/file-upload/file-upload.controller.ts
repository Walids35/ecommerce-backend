import { Request, Response } from 'express';
import { UploadService } from './file-upload.service';
import { DeleteResponseDto, UploadResponseDto } from './dto/file-upload.dto';

export class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  /**
   * Upload single file
   */
  uploadSingle = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided',
          error: 'Please upload a file'
        } as UploadResponseDto);
        return;
      }

      const options = {
        folder: req.body.folder,
        maxSizeInMB: req.body.maxSizeInMB ? Number(req.body.maxSizeInMB) : undefined
      };

      const result = await this.uploadService.uploadFile(req.file, options);

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: result
      } as UploadResponseDto);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'File upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as UploadResponseDto);
    }
  };

  /**
   * Upload multiple files
   */
  uploadMultiple = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files provided',
          error: 'Please upload at least one file'
        });
        return;
      }

      const options = {
        folder: req.body.folder,
        maxSizeInMB: req.body.maxSizeInMB ? Number(req.body.maxSizeInMB) : undefined
      };

      const results = await this.uploadService.uploadMultipleFiles(
        req.files as Express.Multer.File[],
        options
      );

      res.status(200).json({
        success: true,
        message: `${results.length} files uploaded successfully`,
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Files upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Delete file
   */
  deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        res.status(400).json({
          success: false,
          message: 'File path is required',
          error: 'Please provide a file path'
        } as DeleteResponseDto);
        return;
      }

      await this.uploadService.deleteFile(filePath);

      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      } as DeleteResponseDto);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'File deletion failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as DeleteResponseDto);
    }
  };

  /**
   * Get file metadata
   */
  getFileMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filePath } = req.params;

      if (!filePath) {
        res.status(400).json({
          success: false,
          message: 'File path is required'
        });
        return;
      }

      const metadata = await this.uploadService.getFileMetadata(filePath);

      res.status(200).json({
        success: true,
        message: 'Metadata retrieved successfully',
        data: metadata
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve metadata',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}