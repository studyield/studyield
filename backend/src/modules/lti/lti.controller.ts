import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { LtiService } from './lti.service';
import { LtiConfigService } from './lti-config.service';
import { RegisterPlatformDto, PostGradeDto } from './dto';

@ApiTags('LTI')
@Controller('lti')
export class LtiController {
  private readonly logger = new Logger(LtiController.name);

  constructor(
    private readonly ltiService: LtiService,
    private readonly ltiConfigService: LtiConfigService,
  ) {}

  // ─────────────────────────────────────────────────
  // LTI 1.3 Protocol Endpoints (public — no JWT guard)
  // ─────────────────────────────────────────────────

  /**
   * OIDC Login Initiation — the platform redirects the user here first.
   * We respond by redirecting to the platform's authorization endpoint.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.FOUND)
  @ApiOperation({ summary: 'LTI 1.3 OIDC login initiation' })
  @ApiResponse({ status: 302, description: 'Redirect to platform authorization endpoint' })
  async login(@Body() body: Record<string, string>, @Res() res: Response): Promise<void> {
    const redirectUrl = await this.ltiService.handleLoginInitiation({
      iss: body.iss,
      login_hint: body.login_hint,
      target_link_uri: body.target_link_uri,
      lti_message_hint: body.lti_message_hint,
      client_id: body.client_id,
    });

    res.redirect(redirectUrl);
  }

  /**
   * LTI Launch Callback — receives the id_token from the platform after OIDC auth.
   * Validates the JWT, maps the user, and redirects to the Studyield frontend.
   */
  @Public()
  @Post('launch')
  @HttpCode(HttpStatus.FOUND)
  @ApiOperation({ summary: 'LTI 1.3 launch callback' })
  @ApiResponse({ status: 302, description: 'Redirect to Studyield frontend with session' })
  async launch(@Body() body: Record<string, string>, @Res() res: Response): Promise<void> {
    const { id_token, state } = body;

    if (!id_token || !state) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Missing id_token or state in LTI launch',
      });
      return;
    }

    try {
      const result = await this.ltiService.handleLaunch(id_token, state);
      res.redirect(result.redirectUrl);
    } catch (error) {
      this.logger.error('LTI launch failed', error);
      res.status(HttpStatus.UNAUTHORIZED).json({
        message: error instanceof Error ? error.message : 'LTI launch failed',
      });
    }
  }

  /**
   * JWKS Endpoint — platforms fetch this to verify our tool signatures.
   */
  @Public()
  @Get('keys')
  @ApiOperation({ summary: 'JWKS endpoint for LTI platform verification' })
  @ApiResponse({ status: 200, description: 'JSON Web Key Set' })
  getKeys(): { keys: Record<string, unknown>[] } {
    return this.ltiService.getJwks();
  }

  // ─────────────────────────────────────────────────
  // Grade Passback (authenticated)
  // ─────────────────────────────────────────────────

  /**
   * Post a grade back to the LMS for a student.
   * Called internally when a quiz/exam is completed.
   */
  @Post('grade')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post a grade back to the LMS via AGS' })
  @ApiResponse({ status: 200, description: 'Grade post result' })
  async postGrade(
    @Body() dto: PostGradeDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.ltiService.postGrade({
      userId: dto.userId,
      scoreGiven: dto.scoreGiven,
      scoreMaximum: dto.scoreMaximum,
      activityProgress: dto.activityProgress,
      gradingProgress: dto.gradingProgress,
      comment: dto.comment,
    });
  }

  // ─────────────────────────────────────────────────
  // Admin: Platform Registration (admin-only)
  // ─────────────────────────────────────────────────

  @Post('platforms')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new LMS platform for LTI' })
  @ApiResponse({ status: 201, description: 'Platform registered' })
  async registerPlatform(@Body() dto: RegisterPlatformDto) {
    return this.ltiConfigService.registerPlatform(dto);
  }

  @Get('platforms')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all registered LTI platforms' })
  @ApiResponse({ status: 200, description: 'Array of registered platforms' })
  async listPlatforms() {
    return this.ltiConfigService.listPlatforms();
  }

  @Delete('platforms/:id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a registered LTI platform' })
  @ApiResponse({ status: 204, description: 'Platform deleted' })
  async deletePlatform(@Param('id') id: string): Promise<void> {
    await this.ltiConfigService.deletePlatform(id);
  }
}
