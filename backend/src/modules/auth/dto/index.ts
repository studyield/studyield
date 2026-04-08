import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AppleUserData {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class OAuthDto {
  @ApiProperty({ description: 'ID token from OAuth provider' })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiPropertyOptional({
    description: 'Optional user data from Apple Sign In (only provided on first authorization)',
  })
  @ValidateNested()
  @Type(() => AppleUserData)
  @IsOptional()
  userData?: AppleUserData;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewSecureP@ss123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldP@ss123' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: 'NewSecureP@ss123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}

export class TokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  expiresIn: number;
}

export class SubscriptionDto {
  @ApiProperty({ enum: ['free', 'monthly', 'yearly'] })
  plan: 'free' | 'monthly' | 'yearly';

  @ApiProperty({ enum: ['active', 'canceled', 'past_due', 'trialing'] })
  status: 'active' | 'canceled' | 'past_due' | 'trialing';

  @ApiPropertyOptional()
  currentPeriodStart?: Date;

  @ApiPropertyOptional()
  currentPeriodEnd?: Date;

  @ApiProperty()
  cancelAtPeriodEnd: boolean;
}

export class AuthResponseDto {
  @ApiProperty()
  user: {
    id: string;
    email: string;
  };

  @ApiProperty()
  tokens: TokenResponseDto;

  @ApiProperty({ type: SubscriptionDto })
  subscription: SubscriptionDto;
}
