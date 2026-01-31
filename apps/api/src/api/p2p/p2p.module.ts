import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { P2PController } from './p2p.controller';
import { P2PService } from './p2p.service';
import { P2PGateway } from './p2p.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_ACCESS_EXPIRATION', '15m') },
      }),
    }),
  ],
  controllers: [P2PController],
  providers: [P2PService, P2PGateway],
  exports: [P2PService, P2PGateway],
})
export class P2PModule {}
