import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from '../ai/ai.service';
import pdfParse from 'pdf-parse';
import * as cheerio from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';
import ytdl from '@distube/ytdl-core';
import {
  ExtractWebsiteDto,
  ExtractYouTubeDto,
  ExtractWebsiteResponseDto,
  ExtractYouTubeResponseDto,
  ExtractAudioResponseDto,
} from './dto/extract.dto';

const ALLOWED_PDF_TYPES = ['application/pdf'];
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const ALLOWED_TEXT_TYPES = ['text/plain', 'text/markdown', 'text/csv'];
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/flac',
  'audio/webm',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_AUDIO_FILE_SIZE = 50 * 1024 * 1024; // 50MB for audio

@ApiTags('Content')
@Controller('content')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContentExtractController {
  private readonly logger = new Logger(ContentExtractController.name);

  constructor(private readonly aiService: AiService) {}
  @Post('extract')
  @ApiOperation({ summary: 'Extract text from uploaded file (PDF, image, or text)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Text extracted successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async extractText(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ text: string; mimeType: string }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 20MB limit');
    }

    const mimeType = file.mimetype.toLowerCase();

    // Handle PDF files
    if (ALLOWED_PDF_TYPES.includes(mimeType)) {
      return this.extractFromPdf(file);
    }

    // Handle image files (OCR)
    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return this.extractFromImage(file);
    }

    // Handle text files
    if (ALLOWED_TEXT_TYPES.includes(mimeType)) {
      return this.extractFromText(file);
    }

    throw new BadRequestException(
      'Unsupported file type. Please upload a PDF, image (PNG, JPEG), or text file.',
    );
  }

  private async extractFromPdf(
    file: Express.Multer.File,
  ): Promise<{ text: string; mimeType: string }> {
    try {
      const data = await pdfParse(file.buffer);
      const text = data.text.trim();

      if (!text) {
        throw new BadRequestException(
          'Could not extract text from PDF. The file may be image-based.',
        );
      }

      return {
        text: this.cleanText(text),
        mimeType: 'application/pdf',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to parse PDF file. Please ensure it is a valid PDF.');
    }
  }

  private async extractFromImage(
    file: Express.Multer.File,
  ): Promise<{ text: string; mimeType: string }> {
    this.logger.log(`Image OCR requested for file: ${file.originalname}`);

    try {
      const base64 = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64}`;

      const response = await this.aiService.complete(
        [
          {
            role: 'system',
            content:
              'You are an OCR assistant. Extract ALL text from the provided image accurately. Preserve the structure (headings, lists, paragraphs) as much as possible. Return only the extracted text, no commentary.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract all text from this image:' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ] as unknown as string,
          },
        ],
        { model: 'openai/gpt-4o', maxTokens: 4096, temperature: 0.1 },
      );

      const text = response.content.trim();
      if (!text) {
        throw new BadRequestException('Could not extract text from the image.');
      }

      return { text, mimeType: file.mimetype };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Image OCR failed: ${error}`);
      throw new BadRequestException(
        'Failed to extract text from image. Please try again or use text input.',
      );
    }
  }

  private extractFromText(file: Express.Multer.File): { text: string; mimeType: string } {
    try {
      const text = file.buffer.toString('utf-8').trim();

      if (!text) {
        throw new BadRequestException('The text file is empty.');
      }

      return {
        text: this.cleanText(text),
        mimeType: file.mimetype,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to read text file.');
    }
  }

  @Post('extract-handwriting')
  @ApiOperation({ summary: 'Extract text from handwritten notes (images)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Handwriting extracted successfully' })
  @UseInterceptors(FilesInterceptor('files', 10))
  async extractHandwriting(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ texts: Array<{ filename: string; text: string }>; combinedText: string }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image file is required');
    }

    const results: Array<{ filename: string; text: string }> = [];

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype.toLowerCase())) {
        throw new BadRequestException(
          `Unsupported file type: ${file.originalname}. Only images are accepted.`,
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(`File ${file.originalname} exceeds 20MB limit.`);
      }

      try {
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;

        const response = await this.aiService.complete(
          [
            {
              role: 'system',
              content:
                'You are a handwriting recognition specialist. Extract ALL handwritten text from the provided image as accurately as possible. Preserve structure like headings, bullet points, numbered lists, and paragraphs. If there are diagrams or drawings, describe them briefly in [brackets]. Return only the extracted text.',
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract all handwritten text from this image:' },
                { type: 'image_url', image_url: { url: dataUrl } },
              ] as unknown as string,
            },
          ],
          { model: 'openai/gpt-4o', maxTokens: 4096, temperature: 0.1 },
        );

        results.push({ filename: file.originalname, text: response.content.trim() });
      } catch (error) {
        this.logger.error(`Handwriting extraction failed for ${file.originalname}: ${error}`);
        results.push({
          filename: file.originalname,
          text: `[Failed to extract text from ${file.originalname}]`,
        });
      }
    }

    return {
      texts: results,
      combinedText: results.map((r) => r.text).join('\n\n---\n\n'),
    };
  }

  @Post('extract-website')
  @ApiOperation({ summary: 'Extract text content from a webpage' })
  @ApiBody({ type: ExtractWebsiteDto })
  @ApiResponse({
    status: 201,
    description: 'Text extracted successfully',
    type: ExtractWebsiteResponseDto,
  })
  async extractWebsite(@Body() dto: ExtractWebsiteDto): Promise<ExtractWebsiteResponseDto> {
    this.logger.log(`Website extraction requested for: ${dto.url}`);

    try {
      const response = await fetch(dto.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new BadRequestException(
          `Failed to fetch URL: ${response.status} ${response.statusText}`,
        );
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove non-content elements
      $(
        'script, style, nav, footer, header, aside, noscript, iframe, svg, form, button, input, [role="navigation"], [role="banner"], [role="contentinfo"], .nav, .navbar, .footer, .header, .sidebar, .advertisement, .ad, .ads, .social-share, .comments',
      ).remove();

      // Extract title
      const title = $('title').text().trim() || $('h1').first().text().trim() || undefined;

      // Extract main content with priority
      const mainContent =
        $('article').text() ||
        $('main').text() ||
        $('[role="main"]').text() ||
        $('.content').text() ||
        $('.post-content').text() ||
        $('.entry-content').text() ||
        $('body').text();

      // Clean up the text
      const text = mainContent
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (!text || text.length < 50) {
        throw new BadRequestException(
          'Could not extract meaningful content from the webpage. The page may be JavaScript-rendered or require authentication.',
        );
      }

      return { text, title, url: dto.url };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Website extraction failed: ${error}`);
      throw new BadRequestException(
        'Failed to extract content from the website. Please check the URL and try again.',
      );
    }
  }

  @Post('extract-youtube')
  @ApiOperation({ summary: 'Extract transcript from a YouTube video' })
  @ApiBody({ type: ExtractYouTubeDto })
  @ApiResponse({
    status: 201,
    description: 'Transcript extracted successfully',
    type: ExtractYouTubeResponseDto,
  })
  async extractYouTube(@Body() dto: ExtractYouTubeDto): Promise<ExtractYouTubeResponseDto> {
    this.logger.log(`YouTube extraction requested for: ${dto.url}`);

    // Extract video ID from various YouTube URL formats
    const videoId = this.extractYouTubeVideoId(dto.url);
    if (!videoId) {
      throw new BadRequestException(
        'Invalid YouTube URL. Please provide a valid YouTube video URL.',
      );
    }

    // First, try to get captions
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

      if (transcriptItems && transcriptItems.length > 0) {
        const text = transcriptItems
          .map((item) => item.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        this.logger.log(`YouTube transcript extracted via captions: ${text.length} chars`);
        return { text, videoId };
      }
    } catch (captionError) {
      this.logger.warn(
        `No captions available, falling back to audio transcription: ${captionError}`,
      );
    }

    // Fallback: Download audio and transcribe with Whisper
    try {
      this.logger.log(`Downloading audio for video: ${videoId}`);

      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const info = await ytdl.getInfo(videoUrl);

      // Get audio-only format
      const audioFormat = ytdl.chooseFormat(info.formats, {
        quality: 'lowestaudio',
        filter: 'audioonly',
      });

      if (!audioFormat) {
        throw new Error('No audio format available');
      }

      // Download audio to buffer
      const chunks: Buffer[] = [];
      const audioStream = ytdl(videoUrl, { format: audioFormat });

      await new Promise<void>((resolve, reject) => {
        audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        audioStream.on('end', () => resolve());
        audioStream.on('error', reject);
      });

      const audioBuffer = Buffer.concat(chunks);
      this.logger.log(`Audio downloaded: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      // Transcribe with Whisper
      const result = await this.aiService.transcribeAudio(
        audioBuffer,
        `${videoId}.webm`,
        'audio/webm',
      );

      this.logger.log(`YouTube audio transcribed: ${result.text.length} chars`);
      return { text: result.text, videoId };
    } catch (error) {
      this.logger.error(`YouTube audio transcription failed: ${error}`);
      throw new BadRequestException(
        'Failed to extract content from the YouTube video. Please try a different video or use the audio upload option.',
      );
    }
  }

  @Post('extract-audio')
  @ApiOperation({ summary: 'Transcribe audio file using Whisper AI' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Audio file (mp3, wav, m4a, ogg, flac, webm)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Audio transcribed successfully',
    type: ExtractAudioResponseDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async extractAudio(@UploadedFile() file: Express.Multer.File): Promise<ExtractAudioResponseDto> {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }

    if (file.size > MAX_AUDIO_FILE_SIZE) {
      throw new BadRequestException('Audio file size exceeds 50MB limit');
    }

    const mimeType = file.mimetype.toLowerCase();
    if (!ALLOWED_AUDIO_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        'Unsupported audio format. Please upload an mp3, wav, m4a, ogg, flac, or webm file.',
      );
    }

    this.logger.log(`Audio transcription requested for file: ${file.originalname}`);

    try {
      const result = await this.aiService.transcribeAudio(file.buffer, file.originalname, mimeType);
      return {
        text: result.text,
        duration: result.duration,
        language: result.language,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Audio transcription failed: ${error}`);
      throw new BadRequestException('Failed to transcribe audio. Please try again.');
    }
  }

  private extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/, // Just the video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  private cleanText(text: string): string {
    return (
      text
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove page numbers patterns
        .replace(/\b(Page|Pg\.?)\s*\d+\b/gi, '')
        // Remove header/footer patterns
        .replace(/^.{0,50}$/gm, '')
        // Normalize line breaks
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
  }
}
