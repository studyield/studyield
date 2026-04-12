import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LtiService } from './lti.service';
import { LtiConfigService } from './lti-config.service';
import { LtiController } from './lti.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION', '7d'),
        },
      }),
    }),
  ],
  controllers: [LtiController],
  providers: [LtiService, LtiConfigService],
  exports: [LtiService, LtiConfigService],
})
export class LtiModule {}
