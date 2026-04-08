import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateFlashcardDto {
  @ApiProperty({ description: 'Study set ID' })
  @IsString()
  @IsNotEmpty()
  studySetId: string;

  @ApiProperty({ description: 'Front side of the flashcard (question/term)' })
  @IsString()
  @IsNotEmpty()
  front: string;

  @ApiProperty({ description: 'Back side of the flashcard (answer/definition)' })
  @IsString()
  @IsNotEmpty()
  back: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Card type', enum: ['standard', 'cloze', 'image_occlusion'] })
  @IsString()
  @IsOptional()
  type?: 'standard' | 'cloze' | 'image_occlusion';
}

export class UpdateFlashcardDto {
  @ApiPropertyOptional({ description: 'Front side of the flashcard' })
  @IsString()
  @IsOptional()
  front?: string;

  @ApiPropertyOptional({ description: 'Back side of the flashcard' })
  @IsString()
  @IsOptional()
  back?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Card type', enum: ['standard', 'cloze', 'image_occlusion'] })
  @IsString()
  @IsOptional()
  type?: 'standard' | 'cloze' | 'image_occlusion';
}

export class ReviewFlashcardDto {
  @ApiProperty({ description: 'SM-2 quality rating (0-5)', minimum: 0, maximum: 5 })
  @IsNotEmpty()
  quality: 0 | 1 | 2 | 3 | 4 | 5;
}
