import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsArray, IsBoolean } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'college' })
  @IsString()
  @IsOptional()
  educationLevel?: string;

  @ApiPropertyOptional({ example: ['Mathematics', 'Physics'] })
  @IsArray()
  @IsOptional()
  subjects?: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  profileCompleted?: boolean;

  @ApiPropertyOptional({ example: { theme: 'dark', notifications: true } })
  @IsObject()
  @IsOptional()
  preferences?: Record<string, unknown>;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty()
  role: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty({ nullable: true })
  educationLevel: string | null;

  @ApiProperty({ type: [String] })
  subjects: string[];

  @ApiProperty()
  profileCompleted: boolean;

  @ApiProperty()
  preferences: Record<string, unknown>;

  @ApiProperty()
  plan: string;

  @ApiPropertyOptional()
  billingCycle: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class UserStatsDto {
  @ApiProperty()
  studySetsCount: number;

  @ApiProperty()
  flashcardsCount: number;

  @ApiProperty()
  quizzesCompleted: number;

  @ApiProperty()
  streakDays: number;
}
