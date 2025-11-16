import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

import { ProductSearchService } from './product-search.service';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        node: `http://${configService.get<string>('ELASTIC_HOST')}:${configService.get<number>('ELASTIC_HTTP_PORT')}`,
        auth: {
          username: configService.get<string>('ELASTIC_USERNAME')!,
          password: configService.get<string>('ELASTIC_PASSWORD')!,
        },
      }),
    }),
  ],
  providers: [ProductSearchService],
  exports: [ProductSearchService],
})
export class SearchModule {}
