import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
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
import { DocumentsService, UpdateDocumentDto } from './documents.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { SubscriptionService } from '../subscription/subscription.service';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'image/png',
  'image/jpeg',
];

const MAX_FILE_SIZE_FREE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_PRO = 100 * 1024 * 1024; // 100MB

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly storageService: StorageService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        studySetId: { type: 'string' },
        title: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body('studySetId') studySetId: string,
    @Body('title') title?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    const isPro = await this.subscriptionService.isPro(user.sub);
    const maxSize = isPro ? MAX_FILE_SIZE_PRO : MAX_FILE_SIZE_FREE;
    if (file.size > maxSize) {
      throw new BadRequestException(
        isPro
          ? 'File size exceeds 100MB limit'
          : 'Free plan allows up to 10MB per file. Upgrade to Pro for 100MB uploads.',
      );
    }

    // Check storage quota
    await this.subscriptionService.checkStorageQuota(user.sub, file.size);

    const { url } = await this.storageService.upload(file.buffer, file.originalname, {
      contentType: file.mimetype,
      folder: `documents/${user.sub}`,
    });

    return this.documentsService.create(user.sub, {
      studySetId,
      title: title || file.originalname,
      fileName: file.originalname,
      fileUrl: url,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get user documents' })
  @ApiResponse({ status: 200, description: 'Documents list' })
  async findMine(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    const { data, total } = await this.documentsService.findByUser(
      user.sub,
      pagination.page,
      pagination.limit,
    );
    return new PaginatedResponseDto(data, total, pagination.page || 1, pagination.limit || 20);
  }

  @Get('study-set/:studySetId')
  @ApiOperation({ summary: 'Get documents by study set' })
  @ApiResponse({ status: 200, description: 'Documents list' })
  async findByStudySet(@Param('studySetId') studySetId: string) {
    return this.documentsService.findByStudySet(studySetId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: 200, description: 'Document' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.documentsService.findByIdWithAccess(id, user.sub);
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Get signed download URL' })
  @ApiResponse({ status: 200, description: 'Download URL' })
  async getDownloadUrl(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const url = await this.documentsService.getDownloadUrl(id, user.sub);
    return { url };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update document' })
  @ApiResponse({ status: 200, description: 'Document updated' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 204, description: 'Document deleted' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.documentsService.delete(id, user.sub);
  }
}
