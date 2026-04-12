import { IsString, IsNumber, IsNotEmpty, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostGradeDto {
  @ApiProperty({ description: 'User ID of the student' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Score achieved', example: 85 })
  @IsNumber()
  @Min(0)
  scoreGiven: number;

  @ApiProperty({ description: 'Maximum possible score', example: 100 })
  @IsNumber()
  @Min(1)
  scoreMaximum: number;

  @ApiPropertyOptional({
    description: 'Activity progress status',
    example: 'Completed',
    enum: ['Initialized', 'Started', 'InProgress', 'Submitted', 'Completed'],
  })
  @IsString()
  @IsOptional()
  activityProgress?: string;

  @ApiPropertyOptional({
    description: 'Grading progress status',
    example: 'FullyGraded',
    enum: ['FullyGraded', 'Pending', 'PendingManual', 'Failed', 'NotReady'],
  })
  @IsString()
  @IsOptional()
  gradingProgress?: string;

  @ApiPropertyOptional({ description: 'Optional comment for the grade' })
  @IsString()
  @IsOptional()
  comment?: string;
}
