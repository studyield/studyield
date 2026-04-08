import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { FirebaseModule } from '../firebase';
import { GatewayModule } from '../../common/gateways/gateway.module';

@Module({
  imports: [FirebaseModule, GatewayModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
