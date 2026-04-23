import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterPlatformDto {
  @ApiProperty({ description: 'Human-readable platform name', example: 'Canvas Production' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Platform base URL', example: 'https://canvas.university.edu' })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  platformUrl: string;

  @ApiProperty({ description: 'OAuth2 client ID issued by the platform' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: 'OIDC authorization endpoint',
    example: 'https://canvas.university.edu/api/lti/authorize_redirect',
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  authEndpoint: string;

  @ApiProperty({
    description: 'OAuth2 token endpoint',
    example: 'https://canvas.university.edu/login/oauth2/token',
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  tokenEndpoint: string;

  @ApiProperty({
    description: 'JWKS URL for verifying platform signatures',
    example: 'https://canvas.university.edu/api/lti/security/jwks',
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  jwksUrl: string;
}
