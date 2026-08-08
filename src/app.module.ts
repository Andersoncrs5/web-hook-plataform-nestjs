import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { InfraModule } from './infra/infra.module';
import { UserModule } from './modules/user/user.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuthModule } from './modules/auth/auth.module';
import { SecurityModule } from './common/crypto/security.module';
import { UserRoleModule } from './modules/user-role/user-role.module';
import { DatabaseModule } from './infra/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ConfigModule,
    UserModule,
    AuthModule,
    SecurityModule,
    RolesModule,
    InfraModule,
    UserRoleModule
  ],
  controllers: [AppController],
  providers: [AppService, InfraModule],
})
export class AppModule {}
