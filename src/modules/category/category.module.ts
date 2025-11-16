import { Module } from '@nestjs/common';

import { MainDatabaseModule } from '../main-database/main-database.module';

import { CategoryController } from './category.controller';

@Module({
  imports: [MainDatabaseModule],
  controllers: [CategoryController],
  providers: [],
  exports: [],
})
export class CategoryModule {}
