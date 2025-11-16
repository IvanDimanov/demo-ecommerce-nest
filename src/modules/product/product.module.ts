import { Module } from '@nestjs/common';

import { MainDatabaseModule } from '../main-database/main-database.module';
import { SearchModule } from '../search/search.module';

import { ProductController } from './product.controller';

@Module({
  imports: [MainDatabaseModule, SearchModule],
  controllers: [ProductController],
  providers: [],
  exports: [],
})
export class ProductModule {}
