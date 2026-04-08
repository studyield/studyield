import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

@ApiTags('Storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload/image')
  @ApiOperation({ summary: 'Upload an image to R2 storage' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
      );
    }

    const { key, url } = await this.storageService.upload(file.buffer, file.originalname, {
      contentType: file.mimetype,
      folder: `images/${user.sub}`,
    });

    return {
      key,
      url,
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
    };
  }
}
