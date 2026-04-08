import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean, IsIn } from 'class-validator';

export const NOTE_SOURCE_TYPES = [
  'manual',
  'ai_generated',
  'pdf',
  'youtube',
  'audio',
  'website',
  'handwriting',
] as const;

export type NoteSourceType = (typeof NOTE_SOURCE_TYPES)[number];

export class CreateNoteDto {
  @ApiProperty({ description: 'Study set ID' })
  @IsString()
  @IsNotEmpty()
  studySetId: string;

  @ApiProperty({ description: 'Note title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Note content (plain text or HTML)' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Rich text content as JSON' })
  @IsOptional()
  contentJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'AI-generated summary' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Source type',
    enum: NOTE_SOURCE_TYPES,
    default: 'manual',
  })
  @IsString()
  @IsOptional()
  @IsIn(NOTE_SOURCE_TYPES)
  sourceType?: NoteSourceType;

  @ApiPropertyOptional({ description: 'Source URL' })
  @IsString()
  @IsOptional()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Source metadata' })
  @IsOptional()
  sourceMetadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Pin to top' })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: 'Color for visual categorization' })
  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateNoteDto {
  @ApiPropertyOptional({ description: 'Note title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Note content' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Rich text content as JSON' })
  @IsOptional()
  contentJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'AI-generated summary' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Pin to top' })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: 'Color' })
  @IsString()
  @IsOptional()
  color?: string;
}

export class GenerateNoteDto {
  @ApiProperty({ description: 'Study set ID' })
  @IsString()
  @IsNotEmpty()
  studySetId: string;

  @ApiPropertyOptional({ description: 'Custom title for the note' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Focus topics or keywords' })
  @IsArray()
  @IsOptional()
  focusTopics?: string[];

  @ApiPropertyOptional({
    description: 'Note style',
    enum: ['summary', 'detailed', 'outline', 'key_points'],
  })
  @IsString()
  @IsOptional()
  style?: 'summary' | 'detailed' | 'outline' | 'key_points';
}
