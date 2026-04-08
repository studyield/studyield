import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SESClient,
  SendEmailCommand,
  SESClientConfig,
  GetAccountSendingEnabledCommand,
} from '@aws-sdk/client-ses';

export interface SESEmailOptions {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  tags?: Array<{
    Name: string;
    Value: string;
  }>;
  configurationSetName?: string;
}

export interface SESEmailResponse {
  messageId: string;
  status: 'sent' | 'failed';
  error?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class SESService {
  private readonly logger = new Logger(SESService.name);
  private readonly sesClient: SESClient | null = null;
  private readonly defaultFrom: string;
  private readonly configurationSet?: string;
  private readonly isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'AWS credentials not configured. Email sending will be disabled. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.',
      );
      this.isConfigured = false;
    } else {
      const sesConfig: SESClientConfig = {
        region: this.configService.get('AWS_REGION', 'us-east-1'),
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      };

      this.sesClient = new SESClient(sesConfig);
      this.isConfigured = true;
      this.logger.log(`SES Service initialized with region: ${sesConfig.region}`);
    }

    this.defaultFrom = this.configService.get('EMAIL_DEFAULT_FROM', 'noreply@studyield.com');
    this.configurationSet = this.configService.get('SES_CONFIGURATION_SET');
  }

  isReady(): boolean {
    return this.isConfigured && this.sesClient !== null;
  }

  async sendEmail(options: SESEmailOptions): Promise<SESEmailResponse> {
    if (!this.isReady()) {
      this.logger.warn('SES not configured. Skipping email send to:', options.to);
      return {
        messageId: `mock-${Date.now()}`,
        status: 'failed',
        error: 'SES not configured',
      };
    }

    try {
      const from = options.from || this.defaultFrom;
      const toAddresses = this.normalizeAddresses(options.to);
      const ccAddresses = options.cc ? this.normalizeAddresses(options.cc) : undefined;
      const bccAddresses = options.bcc ? this.normalizeAddresses(options.bcc) : undefined;
      const replyToAddresses = options.replyTo
        ? this.normalizeAddresses(options.replyTo)
        : undefined;

      const command = new SendEmailCommand({
        Source: from,
        Destination: {
          ToAddresses: toAddresses,
          CcAddresses: ccAddresses,
          BccAddresses: bccAddresses,
        },
        ReplyToAddresses: replyToAddresses,
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Text: options.text
              ? {
                  Data: options.text,
                  Charset: 'UTF-8',
                }
              : undefined,
            Html: options.html
              ? {
                  Data: options.html,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
        Tags: options.tags,
        ConfigurationSetName: options.configurationSetName || this.configurationSet,
      });

      const response = await this.sesClient!.send(command);

      this.logger.log(
        `Email sent successfully via SES: ${options.subject} to ${toAddresses.join(', ')}`,
      );
      this.logger.log(`SES Message ID: ${response.MessageId}`);

      return {
        messageId: response.MessageId!,
        status: 'sent',
        details: {
          from,
          to: toAddresses,
          subject: options.subject,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Failed to send email via SES:', error);

      return {
        messageId: `error-${Date.now()}`,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }

  private normalizeAddresses(addresses: string | string[]): string[] {
    return Array.isArray(addresses) ? addresses : [addresses];
  }

  async testConnection(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const command = new GetAccountSendingEnabledCommand({});
      await this.sesClient!.send(command);
      return true;
    } catch (error) {
      this.logger.error('SES connection test failed:', error);
      return false;
    }
  }

  getConfiguration(): {
    region: string;
    defaultFrom: string;
    hasCredentials: boolean;
    configurationSet?: string;
  } {
    return {
      region: this.configService.get('AWS_REGION', 'us-east-1'),
      defaultFrom: this.defaultFrom,
      hasCredentials: this.isConfigured,
      configurationSet: this.configurationSet,
    };
  }
}
