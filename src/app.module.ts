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
import { AuthGuardsModule } from './common/guards/auth-guards.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { validateEnv } from './config/env';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ApplicationModule } from './modules/application/application.module'; // <-- IMPORTANTE
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { OrganizationMembersModule } from './modules/organization-members/organization-members.module';

@Module({
  imports: [
    DatabaseModule,
    AuthGuardsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    ConfigModule,
    UserModule,
    AuthModule,
    SecurityModule,
    RolesModule,
    InfraModule,
    UserRoleModule,
    BootstrapModule,
    OrganizationsModule,
    ApplicationModule,
    ApiKeyModule,
    OrganizationMembersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
