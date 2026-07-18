import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Upload générique (photo de liste scolaire scénario 2, justificatifs, etc.). Renvoie une URL de fichier.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Type de fichier non autorisé (image ou PDF uniquement).'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — kept in sync with UPLOAD_MAX_FILE_SIZE_MB
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu.');
    }

    // NOTE: served from local disk for now. In production this should point
    // to an object storage bucket (S3-compatible) — swap here only.
    return {
      fileName: file.filename,
      fileUrl: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }
}
