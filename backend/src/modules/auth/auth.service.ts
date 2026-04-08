import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { RegisterDto, LoginDto, RefreshTokenDto, OAuthDto, SubscriptionDto } from './dto';
import { OAuth2Client } from 'google-auth-library';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;
  private appleJwksClient: jwksClient.JwksClient;
  private readonly appleClientId: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly subscriptionService: SubscriptionService,
  ) {
    this.googleClient = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'));

    // Apple Sign In JWKS client
    this.appleJwksClient = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 86400000, // 24 hours
    });
    this.appleClientId = this.configService.get<string>('APPLE_CLIENT_ID', '');
  }

  async register(dto: RegisterDto): Promise<{
    user: { id: string; email: string };
    tokens: TokenPair;
    subscription: SubscriptionDto;
  }> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Send verification email
    const verifyToken = uuidv4();
    await this.redisService.set(`email-verify:${verifyToken}`, user.id, 24 * 60 * 60);
    await this.emailService.sendVerificationEmail(user.email, verifyToken);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name || user.email);

    // Get subscription details
    const subscription = await this.getSubscriptionDto(user.id, user.email);

    return {
      user: { id: user.id, email: user.email },
      tokens,
      subscription,
    };
  }

  async login(dto: LoginDto): Promise<{
    user: { id: string; email: string };
    tokens: TokenPair;
    subscription: SubscriptionDto;
  }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.usersService.updateLastLogin(user.id);

    // Get subscription details
    const subscription = await this.getSubscriptionDto(user.id, user.email);

    return {
      user: { id: user.id, email: user.email },
      tokens,
      subscription,
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<TokenPair> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const isBlacklisted = await this.redisService.exists(`blacklist:${dto.refreshToken}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      await this.blacklistToken(dto.refreshToken);

      return this.generateTokens(user.id, user.email, user.role);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    await this.blacklistToken(refreshToken);
  }

  async googleAuth(dto: OAuthDto): Promise<{
    user: { id: string; email: string };
    tokens: TokenPair;
    subscription: SubscriptionDto;
  }> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new BadRequestException('Invalid Google token');
      }

      let user = await this.usersService.findByEmail(payload.email);
      let isNewUser = false;

      if (!user) {
        user = await this.usersService.create({
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          googleId: payload.sub,
          avatarUrl: payload.picture,
          emailVerified: true,
        });
        isNewUser = true;
      } else if (!user.googleId) {
        await this.usersService.linkGoogleAccount(user.id, payload.sub);
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.usersService.updateLastLogin(user.id);

      // Send welcome email for new users
      if (isNewUser) {
        await this.emailService.sendWelcomeEmail(user.email, user.name || user.email);
      }

      // Get subscription details
      const subscription = await this.getSubscriptionDto(user.id, user.email);

      return {
        user: { id: user.id, email: user.email },
        tokens,
        subscription,
      };
    } catch (error) {
      this.logger.error('Google auth failed', error);
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async appleAuth(dto: OAuthDto): Promise<{
    user: { id: string; email: string };
    tokens: TokenPair;
    subscription: SubscriptionDto;
  }> {
    try {
      // Decode the identity token header to get the key ID
      const decoded = jwt.decode(dto.idToken, { complete: true });
      if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
        throw new BadRequestException('Invalid Apple token');
      }

      // Get the signing key from Apple's JWKS
      const key = await this.appleJwksClient.getSigningKey(decoded.header.kid);
      const publicKey = key.getPublicKey();

      // Verify the token
      const payload = jwt.verify(dto.idToken, publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: this.appleClientId,
      }) as jwt.JwtPayload;

      if (!payload.email) {
        throw new BadRequestException('Email not provided by Apple');
      }

      // Find or create user
      let user = await this.usersService.findByEmail(payload.email);

      if (!user) {
        // Apple only provides name on first auth, use it if available
        const name = dto.userData?.name || payload.email.split('@')[0];
        user = await this.usersService.create({
          email: payload.email,
          name,
          appleId: payload.sub,
          emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
        });

        // Send welcome email
        await this.emailService.sendWelcomeEmail(user.email, user.name || user.email);
      } else if (!user.appleId) {
        // Link Apple account to existing user
        await this.usersService.linkAppleAccount(user.id, payload.sub!);
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.usersService.updateLastLogin(user.id);

      // Get subscription details
      const subscription = await this.getSubscriptionDto(user.id, user.email);

      return {
        user: { id: user.id, email: user.email },
        tokens,
        subscription,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Apple auth failed', error);
      throw new UnauthorizedException('Apple authentication failed');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    const resetToken = uuidv4();
    const resetExpiry = 60 * 60; // 1 hour

    await this.redisService.set(`password-reset:${resetToken}`, user.id, resetExpiry);

    // Send password reset email
    const emailSent = await this.emailService.sendPasswordResetEmail(email, resetToken);
    if (emailSent) {
      this.logger.log(`Password reset email sent to ${email}`);
    } else {
      this.logger.warn(`Failed to send password reset email to ${email}`);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.redisService.get(`password-reset:${token}`);
    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(userId, hashedPassword);
    await this.redisService.del(`password-reset:${token}`);

    this.logger.log(`Password reset completed for user ${userId}`);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.password) {
      throw new BadRequestException('Cannot change password for this account');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(userId, hashedPassword);
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.redisService.get(`email-verify:${token}`);
    if (!userId) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.usersService.verifyEmail(userId);
    await this.redisService.del(`email-verify:${token}`);
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verifyToken = uuidv4();
    const verifyExpiry = 24 * 60 * 60; // 24 hours

    await this.redisService.set(`email-verify:${verifyToken}`, user.id, verifyExpiry);

    // Send verification email
    const emailSent = await this.emailService.sendVerificationEmail(user.email, verifyToken);
    if (emailSent) {
      this.logger.log(`Verification email sent to ${user.email}`);
    } else {
      this.logger.warn(`Failed to send verification email to ${user.email}`);
    }
  }

  private async generateTokens(userId: string, email: string, role: string): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '7d'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '30d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 604800, // 7 days in seconds
    };
  }

  private async getSubscriptionDto(userId: string, email: string): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionService.getOrCreateSubscription(userId, email);

    return {
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart || undefined,
      currentPeriodEnd: subscription.currentPeriodEnd || undefined,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }

  private async blacklistToken(token: string): Promise<void> {
    try {
      const payload = this.jwtService.decode(token) as { exp?: number };
      const ttl = payload?.exp ? payload.exp - Math.floor(Date.now() / 1000) : 60 * 60 * 24 * 7;
      if (ttl > 0) {
        await this.redisService.set(`blacklist:${token}`, '1', ttl);
      }
    } catch {
      // Token invalid, no need to blacklist
    }
  }
}
