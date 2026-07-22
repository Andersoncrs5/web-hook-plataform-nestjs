import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService, InfraModule],
})
export class AppModule {}

/*

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {addTransactionalDataSource, getDataSourceByName} from 'typeorm-transactional';
import { User } from './modules/user/entities/user.entity';
import {Role} from "./modules/role/entities/role.entity";
import {UserRole} from "./modules/user-role/entities/user-role.entity";
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ModulesModule } from './modules/modules.module';
import {Category} from "./modules/category/entities/category.entity";
import { BootstrapModule } from './bootstrap/bootstrap.module';
import {Tag} from "./modules/tag/entities/tag.entity";
import { InfraResolver } from './infra/infra.resolver';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'mysql',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          entities: [User, Role, UserRole, Category, Tag],
          autoLoadEntities: configService.get<boolean>('DB_AUTO_LOAD_ENTITY'),
          synchronize: true,
        };
      },
      async dataSourceFactory(options) {
        if (!options) throw new Error('Invalid options passed');

        const existingInstance = getDataSourceByName('default');
        if (existingInstance) return existingInstance;

        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    InfrastructureModule,
    ModulesModule,
    BootstrapModule,
  ],
  providers: [],
})
export class AppModule {}
 */