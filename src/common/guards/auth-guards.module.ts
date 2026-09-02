import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtGuard } from './guards/auth/auth-guards.guard';
import { RolesGuard } from './guards/auth/role.guard';
import { ApiKeyModule } from 'src/modules/api-key/api-key.module';
import { ApiKeyGuard } from './guards/api-key/api-key.guard';

@Global()
@Module({
  imports: [
    ApiKeyModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [JwtGuard, RolesGuard, ApiKeyGuard],
  exports: [JwtModule, JwtGuard, RolesGuard, ApiKeyGuard],
})
export class AuthGuardsModule {}
