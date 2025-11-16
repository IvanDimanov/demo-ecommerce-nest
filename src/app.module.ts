import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import environmentConfig from './common/config/environment.config';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { StatusModule } from './modules/status/status.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environmentConfig],
      envFilePath: ['.env', '.env.local'],
    }),
    CategoryModule,
    ProductModule,
    StatusModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
