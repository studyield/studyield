import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CsvImportOptionsDto {
  @ApiPropertyOptional({ description: 'Delimiter character (default: tab for Quizlet compatibility)', example: '\t' })
  @IsString()
  @IsOptional()
  delimiter?: string;

  @ApiPropertyOptional({ description: 'Column index for front (0-based, default: 0)', example: '0' })
  @IsString()
  @IsOptional()
  frontColumn?: string;

  @ApiPropertyOptional({ description: 'Column index for back (0-based, default: 1)', example: '1' })
  @IsString()
  @IsOptional()
  backColumn?: string;

  @ApiPropertyOptional({ description: 'Whether the first row is a header (default: auto-detect)' })
  @IsString()
  @IsOptional()
  hasHeader?: string;
}

export class ImportResultDto {
  @ApiProperty({ description: 'Number of cards imported' })
  imported: number;

  @ApiProperty({ description: 'Number of cards skipped' })
  skipped: number;

  @ApiProperty({ description: 'Error messages for failed imports', type: [String] })
  errors: string[];
}
