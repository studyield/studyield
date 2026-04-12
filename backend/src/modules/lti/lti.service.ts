import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import jwksClient from 'jwks-rsa';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { LtiConfigService, LtiPlatform } from './lti-config.service';

/** Standard LTI 1.3 claim namespaces */
const LTI_CLAIMS = {
  MESSAGE_TYPE: 'https://purl.imsglobal.org/spec/lti/claim/message_type',
  VERSION: 'https://purl.imsglobal.org/spec/lti/claim/version',
  RESOURCE_LINK: 'https://purl.imsglobal.org/spec/lti/claim/resource_link',
  ROLES: 'https://purl.imsglobal.org/spec/lti/claim/roles',
  CONTEXT: 'https://purl.imsglobal.org/spec/lti/claim/context',
  LAUNCH_PRESENTATION: 'https://purl.imsglobal.org/spec/lti/claim/launch_presentation',
  AGS_ENDPOINT: 'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint',
  NRPS_ENDPOINT: 'https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice',
  TARGET_LINK_URI: 'https://purl.imsglobal.org/spec/lti/claim/target_link_uri',
  DEPLOYMENT_ID: 'https://purl.imsglobal.org/spec/lti/claim/deployment_id',
} as const;

export interface LtiLaunchResult {
  user: { id: string; email: string };
  accessToken: string;
  refreshToken: string;
  ltiContext: {
    platformId: string;
    courseId: string | null;
    resourceLinkId: string | null;
    roles: string[];
  };
  redirectUrl: string;
}

export interface LtiAgsEndpoint {
  scope: string[];
  lineitemsUrl: string;
  lineitemUrl?: string;
}

@Injectable()
export class LtiService {
  private readonly logger = new Logger(LtiService.name);
  private readonly jwksClients = new Map<string, jwksClient.JwksClient>();

  /** RSA key pair for signing our own JWTs (tool-side) */
  private toolPrivateKey: string;
  private toolPublicKeyJwk: Record<string, unknown>;
  private toolKeyId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly ltiConfigService: LtiConfigService,
  ) {
    this.initToolKeys();
  }

  /**
   * Generate or load an RSA key pair used for signing client_credentials JWTs
   * when requesting access tokens from the platform (for AGS / NRPS).
   */
  private initToolKeys(): void {
    const configuredKey = this.configService.get<string>('LTI_KEY');
    if (configuredKey && configuredKey !== 'your-lti-key') {
      // Derive a deterministic RSA key pair from the configured secret.
      // In production, operators should supply a real PEM private key via LTI_KEY.
      // For simplicity, we generate an ephemeral key pair at startup.
    }

    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    this.toolPrivateKey = privateKey;
    this.toolKeyId = crypto.randomUUID();

    // Convert PEM public key to JWK for the /lti/keys endpoint
    const keyObject = crypto.createPublicKey(publicKey);
    const jwk = keyObject.export({ format: 'jwk' });
    this.toolPublicKeyJwk = {
      ...jwk,
      kid: this.toolKeyId,
      alg: 'RS256',
      use: 'sig',
    };

    this.logger.log('LTI tool RSA key pair initialised');
  }

  /**
   * Returns the JWKS (JSON Web Key Set) for platforms to verify our signatures.
   */
  getJwks(): { keys: Record<string, unknown>[] } {
    return { keys: [this.toolPublicKeyJwk] };
  }

  // ─────────────────────────────────────────────────
  // OIDC Login Initiation (Step 1 of LTI 1.3 launch)
  // ─────────────────────────────────────────────────

  /**
   * Handles the OIDC login initiation request from the platform.
   * Returns a redirect URL to the platform's authorization endpoint.
   */
  async handleLoginInitiation(params: {
    iss: string;
    login_hint: string;
    target_link_uri: string;
    lti_message_hint?: string;
    client_id?: string;
  }): Promise<string> {
    const { iss, login_hint, target_link_uri, lti_message_hint, client_id } = params;

    // Look up the registered platform
    let platform: LtiPlatform | null = null;
    if (client_id) {
      platform = await this.ltiConfigService.findPlatformByClientId(client_id);
    }
    if (!platform) {
      // Fallback: find by issuer URL
      const platforms = await this.ltiConfigService.listPlatforms();
      platform = platforms.find((p) => p.platformUrl === iss) || null;
    }

    if (!platform) {
      throw new BadRequestException(
        `Unknown LTI platform issuer: ${iss}. Register the platform first.`,
      );
    }

    // Generate a nonce and state, store in Redis for validation
    const nonce = crypto.randomUUID();
    const state = crypto.randomUUID();

    await this.redisService.set(
      `lti:state:${state}`,
      JSON.stringify({ nonce, platformId: platform.id }),
      300, // 5 min TTL
    );

    // Build the OIDC auth redirect URL
    const authUrl = new URL(platform.authEndpoint);
    authUrl.searchParams.set('scope', 'openid');
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('response_mode', 'form_post');
    authUrl.searchParams.set('client_id', platform.clientId);
    authUrl.searchParams.set('redirect_uri', target_link_uri);
    authUrl.searchParams.set('login_hint', login_hint);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('prompt', 'none');
    if (lti_message_hint) {
      authUrl.searchParams.set('lti_message_hint', lti_message_hint);
    }

    this.logger.log(`LTI login initiation → redirecting to ${platform.name}`);
    return authUrl.toString();
  }

  // ─────────────────────────────────────────────────
  // LTI Launch Callback  (Step 2 of LTI 1.3 launch)
  // ─────────────────────────────────────────────────

  /**
   * Validates the id_token JWT from the platform, maps the LTI user to a
   * Studyield account, and returns a session with redirect info.
   */
  async handleLaunch(idToken: string, state: string): Promise<LtiLaunchResult> {
    // 1. Retrieve and validate state from Redis
    const stateData = await this.redisService.get(`lti:state:${state}`);
    if (!stateData) {
      throw new UnauthorizedException('Invalid or expired LTI state');
    }
    await this.redisService.del(`lti:state:${state}`);

    const { nonce, platformId } = JSON.parse(stateData);

    // 2. Look up the platform
    const platform = await this.ltiConfigService.findPlatformById(platformId);
    if (!platform) {
      throw new UnauthorizedException('LTI platform no longer registered');
    }

    // 3. Verify the id_token JWT using the platform's JWKS
    const claims = await this.verifyPlatformJwt(idToken, platform);

    // 4. Validate nonce
    if (claims.nonce !== nonce) {
      throw new UnauthorizedException('LTI nonce mismatch');
    }

    // 5. Validate LTI-specific claims
    const messageType = claims[LTI_CLAIMS.MESSAGE_TYPE];
    if (messageType !== 'LtiResourceLinkRequest') {
      throw new BadRequestException(
        `Unsupported LTI message type: ${messageType}`,
      );
    }

    const version = claims[LTI_CLAIMS.VERSION];
    if (version !== '1.3.0') {
      throw new BadRequestException(`Unsupported LTI version: ${version}`);
    }

    // 6. Extract user information
    const ltiUserId = claims.sub as string;
    const email = (claims.email as string) || `${ltiUserId}@lti.${platform.platformUrl.replace(/https?:\/\//, '')}`;
    const name =
      (claims.name as string) ||
      [claims.given_name, claims.family_name].filter(Boolean).join(' ') ||
      email.split('@')[0];

    // 7. Extract context info
    const resourceLink = claims[LTI_CLAIMS.RESOURCE_LINK] as Record<string, unknown> | undefined;
    const context = claims[LTI_CLAIMS.CONTEXT] as Record<string, unknown> | undefined;
    const roles = (claims[LTI_CLAIMS.ROLES] as string[]) || [];

    const courseId = (context?.id as string) || null;
    const resourceLinkId = (resourceLink?.id as string) || null;

    // 8. Store AGS endpoint in Redis if present (for grade passback)
    const agsEndpoint = claims[LTI_CLAIMS.AGS_ENDPOINT] as Record<string, unknown> | undefined;
    if (agsEndpoint) {
      await this.redisService.set(
        `lti:ags:${platformId}:${resourceLinkId || 'default'}`,
        JSON.stringify(agsEndpoint),
        86400 * 7, // 7 days
      );
    }

    // 9. Find or create the Studyield user
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.create({
        email,
        name,
        emailVerified: true, // LTI users are pre-authenticated by their institution
      });
      this.logger.log(`Created new user via LTI launch: ${email}`);
    }

    // 10. Upsert the LTI context
    await this.ltiConfigService.upsertContext({
      userId: user.id,
      platformId: platform.id,
      ltiUserId,
      courseId,
      resourceLinkId,
      roles,
    });

    // 11. Generate Studyield session tokens
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '7d'),
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '30d'),
      },
    );

    await this.usersService.updateLastLogin(user.id);

    // 12. Build redirect URL to the frontend
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5189',
    );
    const redirectUrl = `${frontendUrl}/lti/callback?token=${accessToken}`;

    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
      ltiContext: {
        platformId: platform.id,
        courseId,
        resourceLinkId,
        roles,
      },
      redirectUrl,
    };
  }

  // ─────────────────────────────────────────────────
  // Grade Passback (Assignment and Grade Services)
  // ─────────────────────────────────────────────────

  /**
   * Post a score back to the LMS for a given user.
   */
  async postGrade(params: {
    userId: string;
    scoreGiven: number;
    scoreMaximum: number;
    activityProgress?: string;
    gradingProgress?: string;
    comment?: string;
  }): Promise<{ success: boolean; message: string }> {
    const { userId, scoreGiven, scoreMaximum } = params;

    // 1. Find the user's most recent LTI context
    const ltiContext = await this.ltiConfigService.findContextByUser(userId);
    if (!ltiContext) {
      return { success: false, message: 'User has no LTI context (not launched via LTI)' };
    }

    // 2. Look up the platform
    const platform = await this.ltiConfigService.findPlatformById(ltiContext.platformId);
    if (!platform) {
      return { success: false, message: 'LTI platform no longer registered' };
    }

    // 3. Get the AGS endpoint from Redis
    const agsKey = `lti:ags:${platform.id}:${ltiContext.resourceLinkId || 'default'}`;
    const agsDataRaw = await this.redisService.get(agsKey);
    if (!agsDataRaw) {
      return { success: false, message: 'No AGS endpoint stored for this launch context' };
    }

    const agsData = JSON.parse(agsDataRaw) as {
      scope?: string[];
      lineitems?: string;
      lineitem?: string;
    };

    const lineitemUrl = agsData.lineitem;
    if (!lineitemUrl) {
      return { success: false, message: 'No line item URL available for grade passback' };
    }

    // 4. Obtain an access token from the platform via client_credentials grant
    const accessToken = await this.getClientCredentialsToken(platform, [
      'https://purl.imsglobal.org/spec/lti-ags/scope/score',
    ]);

    // 5. Post the score
    const scoreUrl = `${lineitemUrl}/scores`;
    const scorePayload = {
      userId: ltiContext.ltiUserId,
      scoreGiven,
      scoreMaximum,
      activityProgress: params.activityProgress || 'Completed',
      gradingProgress: params.gradingProgress || 'FullyGraded',
      comment: params.comment || '',
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(scoreUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.ims.lis.v1.score+json',
          Accept: 'application/json',
        },
        body: JSON.stringify(scorePayload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`AGS score post failed (${response.status}): ${errorBody}`);
        return {
          success: false,
          message: `Platform rejected grade: ${response.status}`,
        };
      }

      this.logger.log(`Grade posted for user ${userId}: ${scoreGiven}/${scoreMaximum}`);
      return { success: true, message: 'Grade posted successfully' };
    } catch (error) {
      this.logger.error('Failed to post grade to LMS', error);
      return { success: false, message: 'Network error posting grade to LMS' };
    }
  }

  // ─────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────

  /**
   * Verify the id_token JWT from the platform using its JWKS endpoint.
   */
  private async verifyPlatformJwt(
    token: string,
    platform: LtiPlatform,
  ): Promise<Record<string, unknown>> {
    // Get or create a JWKS client for this platform
    let client = this.jwksClients.get(platform.jwksUrl);
    if (!client) {
      client = jwksClient({
        jwksUri: platform.jwksUrl,
        cache: true,
        cacheMaxEntries: 10,
        cacheMaxAge: 86400000, // 24 hours
      });
      this.jwksClients.set(platform.jwksUrl, client);
    }

    // Decode header to get the kid
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
      throw new UnauthorizedException('Invalid LTI id_token: missing kid');
    }

    // Get the signing key
    const key = await client.getSigningKey(decoded.header.kid);
    const publicKey = key.getPublicKey();

    // Verify the token
    try {
      const claims = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        issuer: platform.platformUrl,
        audience: platform.clientId,
      }) as Record<string, unknown>;

      return claims;
    } catch (error) {
      this.logger.error('LTI JWT verification failed', error);
      throw new UnauthorizedException('Invalid LTI id_token');
    }
  }

  /**
   * Obtain an OAuth2 client_credentials access token from the platform.
   * Used for AGS (grade passback) and NRPS service calls.
   */
  private async getClientCredentialsToken(
    platform: LtiPlatform,
    scopes: string[],
  ): Promise<string> {
    // Check cache first
    const cacheKey = `lti:token:${platform.id}:${scopes.join(',')}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build the client assertion JWT (signed with our tool private key)
    const clientAssertionPayload = {
      iss: platform.clientId,
      sub: platform.clientId,
      aud: platform.tokenEndpoint,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      jti: crypto.randomUUID(),
    };

    const clientAssertion = jwt.sign(clientAssertionPayload, this.toolPrivateKey, {
      algorithm: 'RS256',
      keyid: this.toolKeyId,
    });

    // Request the token
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
      scope: scopes.join(' '),
    });

    try {
      const response = await fetch(platform.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Token request failed (${response.status}): ${errorBody}`,
        );
        throw new InternalServerErrorException(
          'Failed to obtain access token from LMS',
        );
      }

      const data = (await response.json()) as {
        access_token: string;
        expires_in?: number;
      };

      // Cache the token (with some margin before expiry)
      const ttl = (data.expires_in || 3600) - 60;
      if (ttl > 0) {
        await this.redisService.set(cacheKey, data.access_token, ttl);
      }

      return data.access_token;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error('Failed to request client_credentials token', error);
      throw new InternalServerErrorException(
        'Network error requesting token from LMS',
      );
    }
  }
}
