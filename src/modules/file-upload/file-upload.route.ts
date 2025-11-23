import { Router } from 'express';
import { UploadController } from './file-upload.controller';
import { upload } from '../../middlewares/upload';

const router = Router();
const uploadController = new UploadController();

router.post('/single', upload.single('file'), uploadController.uploadSingle);
router.post('/multiple', upload.array('files', 10), uploadController.uploadMultiple);
router.delete('/', uploadController.deleteFile);
router.get('/metadata/*filePath', uploadController.getFileMetadata);

export default router;