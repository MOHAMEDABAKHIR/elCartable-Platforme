import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StorageService } from '../storage/storage.service';
import { DOCUMENT_UPLOAD_OPTIONS } from '../storage/file-upload';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Upload générique (photo de liste scolaire scénario 2, justificatifs, etc.). Envoie vers Cloudflare R2 et renvoie une URL publique.',
  })
  @UseInterceptors(FileInterceptor('file', DOCUMENT_UPLOAD_OPTIONS))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu.');
    }

    const stored = await this.storage.upload({
      buffer: file.buffer,
      folder: 'lists',
      originalName: file.originalname,
      mimeType: file.mimetype,
    });

    return {
      fileName: stored.key,
      fileUrl: stored.url,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }
}
