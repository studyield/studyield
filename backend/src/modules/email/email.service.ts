import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESService } from './ses.service';
import { DatabaseService } from '../database/database.service';

export interface EmailOptions {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailLog {
  id: string;
  userId?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  from: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  messageId?: string;
  error?: string;
  sentAt?: Date;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly appUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly sesService: SESService,
    private readonly db: DatabaseService,
  ) {
    this.appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
  }

  async sendEmail(
    options: EmailOptions,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { userId, metadata, ...emailOptions } = options;

      const to = Array.isArray(emailOptions.to) ? emailOptions.to : [emailOptions.to];
      const cc = emailOptions.cc
        ? Array.isArray(emailOptions.cc)
          ? emailOptions.cc
          : [emailOptions.cc]
        : undefined;
      const bcc = emailOptions.bcc
        ? Array.isArray(emailOptions.bcc)
          ? emailOptions.bcc
          : [emailOptions.bcc]
        : undefined;

      const result = await this.sesService.sendEmail({
        from: emailOptions.from,
        to,
        cc,
        bcc,
        subject: emailOptions.subject,
        text: emailOptions.text,
        html: emailOptions.html,
      });

      await this.logEmail({
        userId,
        to,
        cc,
        bcc,
        from:
          emailOptions.from ||
          this.configService.get('EMAIL_DEFAULT_FROM', 'noreply@studyield.com'),
        subject: emailOptions.subject,
        status: result.status,
        messageId: result.messageId,
        error: result.error,
        sentAt: result.status === 'sent' ? new Date() : undefined,
        metadata,
      });

      return {
        success: result.status === 'sent',
        messageId: result.messageId,
        error: result.error,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email: ${(error as Error).message}`,
        (error as Error).stack,
      );

      await this.logEmail({
        userId: options.userId,
        to: Array.isArray(options.to) ? options.to : [options.to],
        from: options.from || this.configService.get('EMAIL_DEFAULT_FROM', 'noreply@studyield.com'),
        subject: options.subject,
        status: 'failed',
        error: (error as Error).message,
        metadata: options.metadata,
      });

      throw error;
    }
  }

  async sendSimpleEmail(
    to: string | string[],
    subject: string,
    content: { text?: string; html?: string },
    options?: {
      from?: string;
      cc?: string | string[];
      bcc?: string | string[];
      userId?: string;
    },
  ) {
    return this.sendEmail({
      to,
      subject,
      text: content.text,
      html: content.html,
      from: options?.from,
      cc: options?.cc,
      bcc: options?.bcc,
      userId: options?.userId,
    });
  }

  async sendVerificationEmail(email: string, token: string, userId?: string): Promise<boolean> {
    const verifyUrl = `${this.appUrl}/verify-email?token=${token}`;
    const template = this.getVerificationTemplate(verifyUrl);

    const result = await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      userId,
      metadata: { type: 'verification', token },
    });

    return result.success;
  }

  async sendPasswordResetEmail(email: string, token: string, userId?: string): Promise<boolean> {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;
    const template = this.getPasswordResetTemplate(resetUrl);

    const result = await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      userId,
      metadata: { type: 'password_reset', token },
    });

    return result.success;
  }

  async sendWelcomeEmail(email: string, name: string, userId?: string): Promise<boolean> {
    const template = this.getWelcomeTemplate(name);

    const result = await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      userId,
      metadata: { type: 'welcome' },
    });

    return result.success;
  }

  async sendStudyReminderEmail(
    email: string,
    name: string,
    streak: number,
    userId?: string,
  ): Promise<boolean> {
    const template = this.getStudyReminderTemplate(name, streak);

    const result = await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      userId,
      metadata: { type: 'study_reminder', streak },
    });

    return result.success;
  }

  async sendWeeklyDigestEmail(
    email: string,
    name: string,
    stats: { cardsReviewed: number; quizzesTaken: number; studyTime: number },
    userId?: string,
  ): Promise<boolean> {
    const template = this.getWeeklyDigestTemplate(name, stats);

    const result = await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      userId,
      metadata: { type: 'weekly_digest', stats },
    });

    return result.success;
  }

  private async logEmail(data: Omit<EmailLog, 'id' | 'createdAt'>): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO email_logs (
          user_id, "to", cc, bcc, "from", subject,
          status, message_id, error, sent_at, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [
          data.userId || null,
          data.to,
          data.cc || null,
          data.bcc || null,
          data.from,
          data.subject,
          data.status,
          data.messageId || null,
          data.error || null,
          data.sentAt || null,
          data.metadata ? JSON.stringify(data.metadata) : null,
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to log email: ${(error as Error).message}`);
    }
  }

  isReady(): boolean {
    return this.sesService.isReady();
  }

  getConfiguration() {
    return this.sesService.getConfiguration();
  }

  private getVerificationTemplate(verifyUrl: string): EmailTemplate {
    return {
      subject: 'Verify Your Studyield Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Studyield!</h1>
            </div>
            <div class="content">
              <p>Thanks for signing up! Please verify your email address to get started.</p>
              <p style="text-align: center;">
                <a href="${verifyUrl}" class="button">Verify Email</a>
              </p>
              <p>Or copy this link: <br><a href="${verifyUrl}">${verifyUrl}</a></p>
              <p>This link expires in 24 hours.</p>
            </div>
            <div class="footer">
              <p>If you didn't create this account, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Studyield!\n\nPlease verify your email by visiting: ${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create this account, you can safely ignore this email.`,
    };
  }

  private getPasswordResetTemplate(resetUrl: string): EmailTemplate {
    return {
      subject: 'Reset Your Studyield Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <p>We received a request to reset your password. Click the button below to choose a new password.</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy this link: <br><a href="${resetUrl}">${resetUrl}</a></p>
              <p>This link expires in 1 hour.</p>
            </div>
            <div class="footer">
              <p>If you didn't request this reset, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Password Reset\n\nWe received a request to reset your password. Visit this link to choose a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this reset, you can safely ignore this email.`,
    };
  }

  private getWelcomeTemplate(name: string): EmailTemplate {
    return {
      subject: "Welcome to Studyield - Let's Start Learning!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .feature { padding: 15px 0; border-bottom: 1px solid #eee; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome, ${name}!</h1>
            </div>
            <div class="content">
              <p>We're excited to have you on board. Here's what you can do with Studyield:</p>
              <div class="feature"><strong>AI-Powered Flashcards</strong> - Create smart flashcards with spaced repetition</div>
              <div class="feature"><strong>RAG Chat</strong> - Ask questions about your study materials</div>
              <div class="feature"><strong>Problem Solver</strong> - Get step-by-step solutions to complex problems</div>
              <div class="feature"><strong>Exam Clone</strong> - Practice with AI-generated questions in your exam style</div>
              <div class="feature"><strong>Deep Research</strong> - Explore topics with AI-assisted research</div>
              <p style="text-align: center;">
                <a href="${this.appUrl}" class="button">Start Learning</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome, ${name}!\n\nWe're excited to have you on board. Here's what you can do with Studyield:\n\n- AI-Powered Flashcards\n- RAG Chat\n- Problem Solver\n- Exam Clone\n- Deep Research\n\nGet started at: ${this.appUrl}`,
    };
  }

  private getStudyReminderTemplate(name: string, streak: number): EmailTemplate {
    const streakText =
      streak > 0 ? `You have a ${streak}-day streak going!` : 'Start building your streak today!';

    return {
      subject: "Time to Study - Don't Break Your Streak!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .streak { font-size: 48px; text-align: center; color: #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Hey ${name}!</h1>
            </div>
            <div class="content">
              <p class="streak">${streak} days</p>
              <p style="text-align: center;">${streakText}</p>
              <p style="text-align: center;">
                <a href="${this.appUrl}/study" class="button">Study Now</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hey ${name}!\n\n${streakText}\n\nStudy now: ${this.appUrl}/study`,
    };
  }

  private getWeeklyDigestTemplate(
    name: string,
    stats: { cardsReviewed: number; quizzesTaken: number; studyTime: number },
  ): EmailTemplate {
    const hours = Math.floor(stats.studyTime / 60);
    const minutes = stats.studyTime % 60;
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} minutes`;

    return {
      subject: 'Your Weekly Studyield Progress Report',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .stats { display: flex; justify-content: space-around; text-align: center; margin: 20px 0; }
            .stat { padding: 20px; }
            .stat-value { font-size: 36px; color: #667eea; font-weight: bold; }
            .stat-label { color: #666; font-size: 14px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Weekly Progress</h1>
              <p>Hey ${name}, here's your week in review!</p>
            </div>
            <div class="content">
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${stats.cardsReviewed}</div>
                  <div class="stat-label">Cards Reviewed</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${stats.quizzesTaken}</div>
                  <div class="stat-label">Quizzes Taken</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${timeStr}</div>
                  <div class="stat-label">Study Time</div>
                </div>
              </div>
              <p style="text-align: center;">
                <a href="${this.appUrl}/analytics" class="button">View Full Report</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Weekly Progress Report for ${name}\n\nCards Reviewed: ${stats.cardsReviewed}\nQuizzes Taken: ${stats.quizzesTaken}\nStudy Time: ${timeStr}\n\nView full report: ${this.appUrl}/analytics`,
    };
  }
}
