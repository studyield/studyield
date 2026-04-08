import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class ExtractWebsiteDto {
  @ApiProperty({
    description: 'URL of the website to extract text from',
    example: 'https://example.com/article',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  url: string;
}

export class ExtractYouTubeDto {
  @ApiProperty({
    description: 'YouTube video URL',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'Please provide a valid YouTube URL' })
  url: string;
}

export class ExtractWebsiteResponseDto {
  @ApiProperty({ description: 'Extracted text content' })
  text: string;

  @ApiPropertyOptional({ description: 'Page title' })
  title?: string;

  @ApiProperty({ description: 'Source URL' })
  url: string;
}

export class ExtractYouTubeResponseDto {
  @ApiProperty({ description: 'Extracted transcript text' })
  text: string;

  @ApiProperty({ description: 'YouTube video ID' })
  videoId: string;
}

export class ExtractAudioResponseDto {
  @ApiProperty({ description: 'Transcribed text' })
  text: string;

  @ApiPropertyOptional({ description: 'Audio duration in seconds' })
  duration?: number;

  @ApiPropertyOptional({ description: 'Detected language' })
  language?: string;
}
