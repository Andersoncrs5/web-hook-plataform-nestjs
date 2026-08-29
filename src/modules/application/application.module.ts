import { Module } from '@nestjs/common';
import { ApplicationController } from './controller/application.controller';

@Module({
  controllers: [ApplicationController],
  providers: [],
})
export class ApplicationModule {}
